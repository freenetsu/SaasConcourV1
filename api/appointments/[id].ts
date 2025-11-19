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
  const { id } = req.query;

  if (!userId) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "ID de rendez-vous invalide" });
  }

  try {
    if (req.method === "GET") {
      // Récupérer un rendez-vous spécifique
      const appointment = await prisma.appointment.findUnique({
        where: { id },
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

      if (!appointment) {
        return res.status(404).json({ error: "Rendez-vous non trouvé" });
      }

      // Vérifier que le rendez-vous appartient à l'utilisateur
      if (appointment.userId !== userId) {
        return res.status(403).json({ error: "Accès refusé" });
      }

      return res.json({ appointment });
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      // Mettre à jour un rendez-vous
      const appointment = await prisma.appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        return res.status(404).json({ error: "Rendez-vous non trouvé" });
      }

      if (appointment.userId !== userId) {
        return res.status(403).json({ error: "Accès refusé" });
      }

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

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && {
            description: description || null,
          }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(location !== undefined && { location: location || null }),
          ...(clientId !== undefined && { clientId: clientId || null }),
          ...(projectId !== undefined && { projectId: projectId || null }),
          ...(status && { status }),
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

      return res.json({
        message: "Rendez-vous mis à jour avec succès",
        appointment: updatedAppointment,
      });
    }

    if (req.method === "DELETE") {
      // Supprimer un rendez-vous
      const appointment = await prisma.appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        return res.status(404).json({ error: "Rendez-vous non trouvé" });
      }

      if (appointment.userId !== userId) {
        return res.status(403).json({ error: "Accès refusé" });
      }

      await prisma.appointment.delete({
        where: { id },
      });

      return res.json({ message: "Rendez-vous supprimé avec succès" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Appointment detail error:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
