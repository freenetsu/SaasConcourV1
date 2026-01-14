import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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

type PrismaEventType = "MEETING" | "DEVELOPMENT" | "TASK" | "BREAK" | "TRAINING" | "UNAVAILABLE" | "DEADLINE" | "REMINDER" | "OTHER";

function mapEventType(type: string | undefined): PrismaEventType | undefined {
  if (!type) return undefined;
  return (eventTypeMapping[type] as PrismaEventType) || "OTHER";
}

function getGoogleColorId(eventType: PrismaEventType): string {
  return typeToGoogleColorId[eventType] || "1";
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "Missing or invalid event ID" });
    return;
  }

  if (req.method === "GET") {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
      });

      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      res.status(200).json(event);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to fetch event"
      });
    }
  }

  if (req.method === "PUT") {
    try {
      const { title, description, type, startDate, endDate, timeZone } = req.body;
      const userTimeZone = timeZone || "Europe/Paris";

      const existingEvent = await prisma.event.findUnique({
        where: { id },
        include: { user: { include: { googleCalendarSync: true } } },
      });

      if (!existingEvent) {
        res.status(404).json({ error: "Event not found" });
        return;
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
              description: description !== undefined ? description : existingEvent.description || undefined,
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
          type: mapEventType(type),
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          lastSyncedAt: existingEvent.googleEventId ? new Date() : undefined,
        },
      });

      res.status(200).json(updatedEvent);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to update event"
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      const existingEvent = await prisma.event.findUnique({
        where: { id },
        include: { user: { include: { googleCalendarSync: true } } },
      });

      if (!existingEvent) {
        res.status(404).json({ error: "Event not found" });
        return;
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

      res.status(200).json({ success: true, message: "Event deleted" });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to delete event"
      });
    }
  }
}
