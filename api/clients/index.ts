import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

const getUserFromRequest = (req: VercelRequest): string | null => {
  return (req.headers["x-user-id"] as string) || null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-user-id"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const userId = getUserFromRequest(req);

  if (!userId) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  try {
    if (req.method === "GET") {
      const clients = await prisma.client.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          phone: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      return res.json({ clients });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Clients error:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
