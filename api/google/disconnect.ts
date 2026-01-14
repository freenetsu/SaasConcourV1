import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "DELETE") {
    try {
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({ error: "Missing userId" });
        return;
      }

      const syncConfig = await prisma.googleCalendarSync.findUnique({
        where: { userId },
      });

      if (!syncConfig) {
        res.status(404).json({ error: "No Google Calendar connection found" });
        return;
      }

      if (syncConfig.accessToken) {
        try {
          await fetch(
            `https://oauth2.googleapis.com/revoke?token=${syncConfig.accessToken}`,
            { method: "POST" }
          );
        } catch (error) {
          console.error("Failed to revoke token:", error);
        }
      }

      await prisma.googleCalendarSync.delete({
        where: { userId },
      });

      res.status(200).json({ success: true, message: "Google Calendar disconnected" });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to disconnect"
      });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
