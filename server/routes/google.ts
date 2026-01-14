import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";

const router = Router();
const prisma = new PrismaClient();

// GET /api/google/oauth/url - Get OAuth authorization URL
router.get("/oauth/url", async (req: Request, res: Response) => {
  try {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.NODE_ENV === "production"
        ? process.env.GOOGLE_REDIRECT_URI_PROD
        : process.env.VITE_GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res
        .status(500)
        .json({ error: "Missing Google OAuth configuration" });
    }

    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"
    );

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    res.json({ authUrl });
  } catch (error) {
    console.error("Get OAuth URL error:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to generate auth URL",
    });
  }
});

// POST /api/google/oauth/callback - Handle OAuth callback
router.post("/oauth/callback", async (req: Request, res: Response) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: "Missing code or userId" });
    }

    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.NODE_ENV === "production"
        ? process.env.GOOGLE_REDIRECT_URI_PROD
        : process.env.VITE_GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res
        .status(500)
        .json({ error: "Missing Google OAuth configuration" });
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);

    await prisma.googleCalendarSync.upsert({
      where: { userId },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token || undefined,
        tokenExpiry: expiryDate,
        lastSyncAt: new Date(),
      },
      create: {
        userId,
        accessToken: access_token,
        refreshToken: refresh_token || undefined,
        tokenExpiry: expiryDate,
        calendarId: "primary",
      },
    });

    res.json({
      success: true,
      accessToken: access_token,
      expiresIn: expires_in,
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "OAuth callback failed",
    });
  }
});

// GET /api/google/status - Get connection status
router.get("/status", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing or invalid userId" });
    }

    const googleSync = await prisma.googleCalendarSync.findUnique({
      where: { userId },
    });

    if (!googleSync || !googleSync.accessToken) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      lastSync: googleSync.lastSyncAt,
    });
  } catch (error) {
    console.error("Get status error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to check status",
    });
  }
});

// DELETE /api/google/disconnect - Disconnect Google Calendar
router.delete("/disconnect", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const syncConfig = await prisma.googleCalendarSync.findUnique({
      where: { userId },
    });

    if (!syncConfig) {
      return res
        .status(404)
        .json({ error: "No Google Calendar connection found" });
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

    res.json({ success: true, message: "Google Calendar disconnected" });
  } catch (error) {
    console.error("Disconnect error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to disconnect",
    });
  }
});

export default router;
