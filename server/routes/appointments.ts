import type { AppointmentStatus } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";

const router = Router();
const prisma = new PrismaClient();

// Middleware pour vérifier l'authentification
const getUserFromRequest = (req: Request): string | null => {
  return (req.headers["x-user-id"] as string) || null;
};

// GET /api/appointments - Liste des rendez-vous
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { status, projectId, clientId } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const whereClause: {
      userId: string;
      status?: AppointmentStatus;
      projectId?: string;
      clientId?: string;
    } = {
      userId,
    };

    if (status && typeof status === "string") {
      whereClause.status = status as AppointmentStatus;
    }

    if (projectId && typeof projectId === "string") {
      whereClause.projectId = projectId;
    }

    if (clientId && typeof clientId === "string") {
      whereClause.clientId = clientId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    res.json({ appointments });
  } catch (error) {
    console.error("Get appointments error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des rendez-vous" });
  }
});

// GET /api/appointments/:id - Détails d'un rendez-vous
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        project: {
          include: {
            projectManager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Rendez-vous non trouvé" });
    }

    // Vérifier que l'utilisateur a accès à ce rendez-vous
    if (appointment.userId !== userId) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    res.json({ appointment });
  } catch (error) {
    console.error("Get appointment error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du rendez-vous" });
  }
});

// POST /api/appointments - Créer un rendez-vous
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
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

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    // Validation
    if (!title || !startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Titre, date de début et date de fin requis" });
    }

    // Vérifier que la date de fin est après la date de début
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        error: "La date de fin doit être après la date de début",
      });
    }

    // Vérifier que le client existe si fourni
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      if (!client) {
        return res.status(404).json({ error: "Client non trouvé" });
      }
    }

    // Vérifier que le projet existe si fourni
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        return res.status(404).json({ error: "Projet non trouvé" });
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        title,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location: location || null,
        status: status || "SCHEDULED",
        userId,
        clientId: clientId || null,
        projectId: projectId || null,
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

    res.status(201).json({
      message: "Rendez-vous créé avec succès",
      appointment,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création du rendez-vous" });
  }
});

// PUT /api/appointments/:id - Modifier un rendez-vous
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;
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

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      return res.status(404).json({ error: "Rendez-vous non trouvé" });
    }

    // Vérifier que l'utilisateur a accès à ce rendez-vous
    if (existingAppointment.userId !== userId) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    // Vérifier que la date de fin est après la date de début si les deux sont fournies
    const newStartDate = startDate
      ? new Date(startDate)
      : existingAppointment.startDate;
    const newEndDate = endDate
      ? new Date(endDate)
      : existingAppointment.endDate;

    if (newEndDate <= newStartDate) {
      return res.status(400).json({
        error: "La date de fin doit être après la date de début",
      });
    }

    // Vérifier que le client existe si fourni
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });
      if (!client) {
        return res.status(404).json({ error: "Client non trouvé" });
      }
    }

    // Vérifier que le projet existe si fourni
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        return res.status(404).json({ error: "Projet non trouvé" });
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(location !== undefined && { location }),
        ...(status !== undefined && { status }),
        ...(clientId !== undefined && { clientId }),
        ...(projectId !== undefined && { projectId }),
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

    res.json({
      message: "Rendez-vous modifié avec succès",
      appointment,
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la modification du rendez-vous" });
  }
});

// DELETE /api/appointments/:id - Supprimer un rendez-vous
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Rendez-vous non trouvé" });
    }

    // Vérifier que l'utilisateur a accès à ce rendez-vous
    if (appointment.userId !== userId) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    res.json({ message: "Rendez-vous supprimé avec succès" });
  } catch (error) {
    console.error("Delete appointment error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression du rendez-vous" });
  }
});

// PATCH /api/appointments/:id/status - Changer le statut d'un rendez-vous
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    if (!status) {
      return res.status(400).json({ error: "Statut requis" });
    }

    const validStatuses = ["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Rendez-vous non trouvé" });
    }

    // Vérifier que l'utilisateur a accès à ce rendez-vous
    if (appointment.userId !== userId) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status },
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

    res.json({
      message: "Statut du rendez-vous modifié avec succès",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Update appointment status error:", error);
    res.status(500).json({ error: "Erreur lors de la modification du statut" });
  }
});

export default router;
