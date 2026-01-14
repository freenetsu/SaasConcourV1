import type { VercelRequest, VercelResponse } from "@vercel/node";

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
      const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = process.env.NODE_ENV === "production"
        ? process.env.GOOGLE_REDIRECT_URI_PROD
        : process.env.VITE_GOOGLE_REDIRECT_URI;

      if (!clientId || !redirectUri) {
        res.status(500).json({ error: "Missing Google OAuth configuration" });
        return;
      }

      const scope = encodeURIComponent(
        "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"
      );

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

      res.status(200).json({ authUrl });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to generate auth URL"
      });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
