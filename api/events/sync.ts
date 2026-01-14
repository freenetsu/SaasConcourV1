import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

// Mapping bidirectionnel entre types locaux et Google Calendar colorId
const typeToGoogleColorId: Record<string, string> = {
  MEETING: "11",
  TASK: "10",
  DEVELOPMENT: "9",
  BREAK: "8",
  TRAINING: "3",
  UNAVAILABLE: "6",
  DEADLINE: "11",
  REMINDER: "5",
  OTHER: "1",
};

const googleColorIdToType: Record<string, PrismaEventType> = {
  "11": "MEETING",
  "10": "TASK",
  "9": "DEVELOPMENT",
  "8": "BREAK",
  "3": "TRAINING",
  "6": "UNAVAILABLE",
  "5": "REMINDER",
  "1": "OTHER",
};

type PrismaEventType = "MEETING" | "DEVELOPMENT" | "TASK" | "BREAK" | "TRAINING" | "UNAVAILABLE" | "DEADLINE" | "REMINDER" | "OTHER";

function getGoogleColorId(eventType: PrismaEventType): string {
  return typeToGoogleColorId[eventType] || "1";
}

function mapGoogleColorIdToType(colorId: string | undefined): PrismaEventType {
  if (!colorId) return "OTHER";
  return googleColorIdToType[colorId] || "OTHER";
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  updated: string;
  status: string;
  colorId?: string;
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing OAuth configuration");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await response.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

async function getGoogleCalendarEvents(
  accessToken: string,
  calendarId: string
): Promise<{ events: GoogleCalendarEvent[] }> {
  const timeMin = new Date();
  timeMin.setMonth(timeMin.getMonth() - 1);
  const timeMax = new Date();
  timeMax.setMonth(timeMax.getMonth() + 3);

  // Note: orderBy: "startTime" est incompatible avec showDeleted: "true"
  // On utilise orderBy: "updated" pour pouvoir récupérer les événements supprimés
  const params = new URLSearchParams({
    maxResults: "2500",
    singleEvents: "true",
    orderBy: "updated",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    showDeleted: "true",
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to fetch Google Calendar events: ${errorData}`);
  }

  const data = await response.json();
  return {
    events: data.items || [],
  };
}

async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: { title: string; description?: string; startDateTime: string; endDateTime: string; timeZone?: string; type?: PrismaEventType }
) {
  const googleEvent = {
    summary: event.title,
    description: event.description || "",
    start: { dateTime: event.startDateTime, timeZone: event.timeZone },
    end: { dateTime: event.endDateTime, timeZone: event.timeZone },
    colorId: event.type ? getGoogleColorId(event.type) : "1",
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googleEvent),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create Google Calendar event");
  }

  return response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "POST") {
    try {
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({ error: "Missing userId" });
        return;
      }

      let googleSync = await prisma.googleCalendarSync.findUnique({
        where: { userId },
      });

      if (!googleSync) {
        res.status(404).json({ error: "Google Calendar not connected" });
        return;
      }

      if (!googleSync.accessToken || !googleSync.refreshToken) {
        res.status(401).json({ error: "Missing access tokens" });
        return;
      }

      if (googleSync.tokenExpiry && new Date() >= googleSync.tokenExpiry) {
        const { accessToken, expiresIn } = await refreshAccessToken(googleSync.refreshToken);
        const newExpiry = new Date();
        newExpiry.setSeconds(newExpiry.getSeconds() + expiresIn);

        googleSync = await prisma.googleCalendarSync.update({
          where: { userId },
          data: {
            accessToken,
            tokenExpiry: newExpiry,
          },
        });
      }

      const { events: googleEvents } = await getGoogleCalendarEvents(
        googleSync.accessToken!,
        googleSync.calendarId
      );

      const localEvents = await prisma.event.findMany({
        where: { userId },
      });

      interface ConflictPair {
        localEvent: {
          id: string;
          title: string;
          updatedAt: Date;
          lastSyncedAt: Date | null;
        };
        googleEvent: GoogleCalendarEvent;
      }

      const conflicts: ConflictPair[] = [];
      let imported = 0;
      let updated = 0;
      let deleted = 0;

      for (const googleEvent of googleEvents) {
        if (googleEvent.status === "cancelled") {
          const localEvent = await prisma.event.findFirst({
            where: { googleEventId: googleEvent.id },
          });

          if (localEvent) {
            await prisma.event.delete({ where: { id: localEvent.id } });
            deleted++;
          }
          continue;
        }

        console.log("=== SYNC DEBUG ===");
        console.log("Event title:", googleEvent.summary);
        console.log("Google Calendar returned start:", JSON.stringify(googleEvent.start));
        console.log("Google Calendar returned end:", JSON.stringify(googleEvent.end));

        const startDate = googleEvent.start.dateTime
          ? new Date(googleEvent.start.dateTime)
          : new Date(googleEvent.start.date + "T00:00:00Z");
        const endDate = googleEvent.end.dateTime
          ? new Date(googleEvent.end.dateTime)
          : new Date(googleEvent.end.date + "T23:59:59Z");

        console.log("Parsed startDate (JS Date):", startDate);
        console.log("startDate.toISOString():", startDate.toISOString());
        console.log("Parsed endDate (JS Date):", endDate);
        console.log("endDate.toISOString():", endDate.toISOString());
        console.log("=== END SYNC DEBUG ===");

        const existingEvent = await prisma.event.findFirst({
          where: { googleEventId: googleEvent.id },
        });

        if (existingEvent) {
          const googleUpdated = new Date(googleEvent.updated);
          const localUpdated = existingEvent.updatedAt;

          if (googleUpdated > localUpdated && localUpdated > (existingEvent.lastSyncedAt || new Date(0))) {
            conflicts.push({ localEvent: existingEvent, googleEvent });
            await prisma.event.update({
              where: { id: existingEvent.id },
              data: { syncStatus: "CONFLICT" },
            });
          } else if (googleUpdated > localUpdated) {
            await prisma.event.update({
              where: { id: existingEvent.id },
              data: {
                title: googleEvent.summary,
                description: googleEvent.description || null,
                type: mapGoogleColorIdToType(googleEvent.colorId),
                startDate,
                endDate,
                syncStatus: "SYNCED",
                lastSyncedAt: new Date(),
              },
            });
            updated++;
          }
        } else {
          await prisma.event.create({
            data: {
              title: googleEvent.summary,
              description: googleEvent.description || null,
              type: mapGoogleColorIdToType(googleEvent.colorId),
              startDate,
              endDate,
              userId,
              googleEventId: googleEvent.id,
              syncStatus: "GOOGLE_ONLY",
              lastSyncedAt: new Date(),
            },
          });
          imported++;
        }
      }

      // Supprimer les événements locaux synchronisés qui n'existent plus dans Google Calendar
      const googleEventIds = new Set(googleEvents.map(e => e.id));
      const syncedLocalEvents = localEvents.filter(
        (e) => e.googleEventId && (e.syncStatus === "SYNCED" || e.syncStatus === "GOOGLE_ONLY")
      );

      for (const localEvent of syncedLocalEvents) {
        if (localEvent.googleEventId && !googleEventIds.has(localEvent.googleEventId)) {
          // L'événement a été supprimé de Google Calendar
          await prisma.event.delete({ where: { id: localEvent.id } });
          deleted++;
        }
      }

      const unsyncedEvents = localEvents.filter(
        (e) => e.syncStatus === "LOCAL" && !e.googleEventId
      );

      for (const localEvent of unsyncedEvents) {
        try {
          const googleEvent = await createGoogleCalendarEvent(
            googleSync.accessToken!,
            googleSync.calendarId,
            {
              title: localEvent.title,
              description: localEvent.description || undefined,
              startDateTime: localEvent.startDate.toISOString(),
              endDateTime: localEvent.endDate.toISOString(),
              timeZone: "UTC",
              type: localEvent.type,
            }
          );

          await prisma.event.update({
            where: { id: localEvent.id },
            data: {
              googleEventId: googleEvent.id,
              syncStatus: "SYNCED",
              lastSyncedAt: new Date(),
            },
          });
        } catch (error) {
          console.error("Failed to sync local event to Google:", error);
        }
      }

      res.status(200).json({
        success: true,
        imported,
        updated,
        deleted,
        conflicts: conflicts.map((c) => ({
          eventId: c.localEvent.id,
          title: c.localEvent.title,
          localUpdated: c.localEvent.updatedAt,
          googleUpdated: c.googleEvent.updated,
        })),
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Sync failed"
      });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
