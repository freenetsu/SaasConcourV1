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

function mapEventType(type: string | undefined): PrismaEventType {
  if (!type) return "OTHER";
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== "string") {
        res.status(400).json({ error: "Missing or invalid userId" });
        return;
      }

      const events = await prisma.event.findMany({
        where: { userId },
        orderBy: { startDate: "asc" },
      });

      console.log("=== API GET EVENTS DEBUG ===");
      events.slice(0, 3).forEach((event) => {
        console.log(`Event: ${event.title}`);
        console.log(`  DB startDate: ${event.startDate}`);
        console.log(`  DB startDate type: ${typeof event.startDate}`);
        console.log(`  DB startDate ISO: ${event.startDate instanceof Date ? event.startDate.toISOString() : event.startDate}`);
      });
      console.log("=== END API GET EVENTS DEBUG ===");

      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to fetch events"
      });
    }
  }

  if (req.method === "POST") {
    try {
      const { title, description, type, startDate, endDate, userId, timeZone } = req.body;

      if (!title || !startDate || !endDate || !userId) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const userTimeZone = timeZone || "Europe/Paris";

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
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to create event"
      });
    }
  }
}
