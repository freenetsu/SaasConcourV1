import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
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

      const googleSync = await prisma.googleCalendarSync.findUnique({
        where: { userId },
      });

      if (!googleSync || !googleSync.accessToken) {
        res.status(200).json({ connected: false });
        return;
      }

      res.status(200).json({
        connected: true,
        lastSync: googleSync.lastSyncAt,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to check status"
      });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
