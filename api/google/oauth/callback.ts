import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

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
      const { code, userId } = req.body;

      if (!code || !userId) {
        res.status(400).json({ error: "Missing code or userId" });
        return;
      }

      const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.NODE_ENV === "production"
        ? process.env.GOOGLE_REDIRECT_URI_PROD
        : process.env.VITE_GOOGLE_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        res.status(500).json({ error: "Missing Google OAuth configuration" });
        return;
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

      res.status(200).json({
        success: true,
        accessToken: access_token,
        expiresIn: expires_in,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "OAuth callback failed"
      });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
