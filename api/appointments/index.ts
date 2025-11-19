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
      // Liste des rendez-vous
      const appointments = await prisma.appointment.findMany({
        where: {
          userId: userId,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: {
          startDate: "desc",
        },
      });

      return res.json({ appointments });
    }

    if (req.method === "POST") {
      // Créer un rendez-vous
      const {
        title,
        description,
        startDate,
        endDate,
        location,
        clientId,
        projectId,
        status,
      } = req.body;

      if (!title || !startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "Titre, date de début et date de fin requis" });
      }

      const appointment = await prisma.appointment.create({
        data: {
          title,
          description: description || null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          location: location || null,
          clientId: clientId || null,
          projectId: projectId || null,
          status: status || "SCHEDULED",
          userId,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Rendez-vous créé avec succès",
        appointment,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Appointments error:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
