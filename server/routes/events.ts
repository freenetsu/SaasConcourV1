import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";

const router = Router();
const prisma = new PrismaClient();

// Mapping des types frontend vers les types Prisma
const eventTypeMapping: Record<string, string> = {
  meeting: "MEETING",
  development: "DEVELOPMENT",
  task: "TASK",
  break: "BREAK",
  training: "TRAINING",
  unavailable: "UNAVAILABLE",
  MEETING: "MEETING",
  DEVELOPMENT: "DEVELOPMENT",
  TASK: "TASK",
  BREAK: "BREAK",
  TRAINING: "TRAINING",
  UNAVAILABLE: "UNAVAILABLE",
  DEADLINE: "DEADLINE",
  REMINDER: "REMINDER",
  OTHER: "OTHER",
};

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

function mapEventType(type: string | undefined): PrismaEventType {
  if (!type) return "OTHER";
  return (eventTypeMapping[type] as PrismaEventType) || "OTHER";
}

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
  event: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    timeZone: string;
    type?: PrismaEventType;
  }
) {
  const googleEvent = {
    summary: event.title,
    description: event.description || "",
    start: {
      dateTime: event.startDateTime,
      timeZone: event.timeZone,
    },
    end: {
      dateTime: event.endDateTime,
      timeZone: event.timeZone,
    },
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
    const errorData = await response.text();
    throw new Error(`Failed to create Google Calendar event: ${errorData}`);
  }

  return response.json();
}

async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  googleEventId: string,
  event: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    timeZone: string;
    type?: PrismaEventType;
  }
) {
  const googleEvent = {
    summary: event.title,
    description: event.description || "",
    start: {
      dateTime: event.startDateTime,
      timeZone: event.timeZone,
    },
    end: {
      dateTime: event.endDateTime,
      timeZone: event.timeZone,
    },
    colorId: event.type ? getGoogleColorId(event.type) : "1",
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googleEvent),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to update Google Calendar event: ${errorData}`);
  }

  return response.json();
}

async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  googleEventId: string
) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 410) {
    const errorData = await response.text();
    throw new Error(`Failed to delete Google Calendar event: ${errorData}`);
  }
}

// GET /api/events - Liste des événements
router.get("/", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing or invalid userId" });
    }

    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { startDate: "asc" },
    });

    console.log("=== EXPRESS GET EVENTS DEBUG ===");
    events.slice(0, 3).forEach((event) => {
      console.log(`Event: ${event.title}`);
      console.log(`  DB startDate: ${event.startDate}`);
      console.log(`  DB startDate type: ${typeof event.startDate}`);
      console.log(`  DB startDate ISO: ${event.startDate instanceof Date ? event.startDate.toISOString() : event.startDate}`);
    });
    console.log("=== END EXPRESS GET EVENTS DEBUG ===");

    res.json(events);
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch events",
    });
  }
});

// GET /api/events/:id - Détails d'un événement
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch event",
    });
  }
});

// POST /api/events - Créer un événement
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, description, type, startDate, endDate, userId, timeZone } = req.body;
    const userTimeZone = timeZone || "Europe/Paris";

    if (!title || !startDate || !endDate || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const googleSync = await prisma.googleCalendarSync.findUnique({
      where: { userId },
    });

    let googleEventId: string | undefined;
    let syncStatus: "LOCAL" | "SYNCED" = "LOCAL";

    if (googleSync?.accessToken) {
      try {
        let accessToken = googleSync.accessToken;

        if (googleSync.tokenExpiry && new Date() > googleSync.tokenExpiry && googleSync.refreshToken) {
          const { accessToken: newAccessToken } = await refreshAccessToken(googleSync.refreshToken);
          accessToken = newAccessToken;
          await prisma.googleCalendarSync.update({
            where: { userId },
            data: { accessToken },
          });
        }

        const googleEvent = await createGoogleCalendarEvent(
          accessToken,
          googleSync.calendarId,
          {
            title,
            description,
            startDateTime: startDate,
            endDateTime: endDate,
            timeZone: userTimeZone,
            type: mapEventType(type),
          }
        );
        googleEventId = googleEvent.id;
        syncStatus = "SYNCED";
      } catch (error) {
        console.error("Failed to sync to Google Calendar:", error);
      }
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type: mapEventType(type),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId,
        googleEventId,
        syncStatus,
        lastSyncedAt: syncStatus === "SYNCED" ? new Date() : null,
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create event",
    });
  }
});

// PUT /api/events/:id - Modifier un événement
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, type, startDate, endDate, timeZone } = req.body;
    const userTimeZone = timeZone || "Europe/Paris";

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: { user: { include: { googleCalendarSync: true } } },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    const googleSync = existingEvent.user.googleCalendarSync;

    if (existingEvent.googleEventId && googleSync?.accessToken) {
      try {
        let accessToken = googleSync.accessToken;

        if (googleSync.tokenExpiry && new Date() > googleSync.tokenExpiry && googleSync.refreshToken) {
          const { accessToken: newAccessToken } = await refreshAccessToken(googleSync.refreshToken);
          accessToken = newAccessToken;
          await prisma.googleCalendarSync.update({
            where: { userId: existingEvent.userId },
            data: { accessToken },
          });
        }

        await updateGoogleCalendarEvent(
          accessToken,
          googleSync.calendarId,
          existingEvent.googleEventId,
          {
            title: title || existingEvent.title,
            description:
              description !== undefined
                ? description
                : existingEvent.description || undefined,
            startDateTime: startDate || existingEvent.startDate.toISOString(),
            endDateTime: endDate || existingEvent.endDate.toISOString(),
            timeZone: userTimeZone,
            type: type ? mapEventType(type) : existingEvent.type,
          }
        );
      } catch (error) {
        console.error("Failed to update Google Calendar event:", error);
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        type: type ? mapEventType(type) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        lastSyncedAt: existingEvent.googleEventId ? new Date() : undefined,
      },
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update event",
    });
  }
});

// DELETE /api/events/:id - Supprimer un événement
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: { user: { include: { googleCalendarSync: true } } },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    const googleSync = existingEvent.user.googleCalendarSync;

    if (existingEvent.googleEventId && googleSync?.accessToken) {
      try {
        let accessToken = googleSync.accessToken;

        if (googleSync.tokenExpiry && new Date() > googleSync.tokenExpiry && googleSync.refreshToken) {
          const { accessToken: newAccessToken } = await refreshAccessToken(googleSync.refreshToken);
          accessToken = newAccessToken;
          await prisma.googleCalendarSync.update({
            where: { userId: existingEvent.userId },
            data: { accessToken },
          });
        }

        await deleteGoogleCalendarEvent(
          accessToken,
          googleSync.calendarId,
          existingEvent.googleEventId
        );
      } catch (error) {
        console.error("Failed to delete Google Calendar event:", error);
      }
    }

    await prisma.event.delete({
      where: { id },
    });

    res.json({ success: true, message: "Event deleted" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete event",
    });
  }
});

// POST /api/events/sync - Synchroniser avec Google Calendar
router.post("/sync", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    let googleSync = await prisma.googleCalendarSync.findUnique({
      where: { userId },
    });

    if (!googleSync) {
      return res.status(404).json({ error: "Google Calendar not connected" });
    }

    if (!googleSync.accessToken || !googleSync.refreshToken) {
      return res.status(401).json({ error: "Missing access tokens" });
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

    // DEBUG LOGS
    console.log("=== SYNC DEBUG ===");
    console.log("Total Google events:", googleEvents.length);
    console.log("Cancelled events:", googleEvents.filter(e => e.status === "cancelled").map(e => ({ id: e.id, summary: e.summary, status: e.status })));
    console.log("Active events:", googleEvents.filter(e => e.status !== "cancelled").map(e => ({ id: e.id, summary: e.summary })));

    const localEvents = await prisma.event.findMany({
      where: { userId },
    });

    console.log("Total local events:", localEvents.length);
    console.log("Local events with googleEventId:", localEvents.filter(e => e.googleEventId).map(e => ({ id: e.id, title: e.title, googleEventId: e.googleEventId, syncStatus: e.syncStatus })));
    console.log("=== END DEBUG ===");

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

      console.log("=== EXPRESS SYNC DEBUG ===");
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
      console.log("=== END EXPRESS SYNC DEBUG ===");

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
            title: googleEvent.summary || "Sans titre",
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

    console.log("=== DELETION CHECK ===");
    console.log("Google Event IDs in response:", Array.from(googleEventIds));
    console.log("Synced local events to check:", syncedLocalEvents.map(e => ({ id: e.id, title: e.title, googleEventId: e.googleEventId })));

    for (const localEvent of syncedLocalEvents) {
      const existsInGoogle = googleEventIds.has(localEvent.googleEventId!);
      console.log(`Checking ${localEvent.title} (${localEvent.googleEventId}): exists in Google = ${existsInGoogle}`);

      if (localEvent.googleEventId && !existsInGoogle) {
        // L'événement a été supprimé de Google Calendar
        console.log(`DELETING local event: ${localEvent.title}`);
        await prisma.event.delete({ where: { id: localEvent.id } });
        deleted++;
      }
    }
    console.log("=== END DELETION CHECK ===");

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

    res.json({
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
    console.error("Sync error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Sync failed",
    });
  }
});

export default router;
