import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";

const router = Router();
const prisma = new PrismaClient();

// Middleware pour vérifier l'authentification
const getUserFromRequest = (req: Request): string | null => {
  return (req.headers["x-user-id"] as string) || null;
};

const getUserRole = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role;
};

// GET /api/projects/:id/members - Liste des membres d'un projet
router.get("/:id/members", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = await getUserRole(userId);

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        projectManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }

    // Vérifier les permissions
    const canView =
      userRole === "ADMIN" ||
      (userRole === "PROJECT_MANAGER" && project.projectManagerId === userId);

    if (!canView) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    res.json({ members: project.members });
  } catch (error) {
    console.error("Get project members error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des membres" });
  }
});

// POST /api/projects/:id/members - Ajouter un membre à un projet
router.post("/:id/members", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;
    const { userIds } = req.body; // Array d'IDs d'utilisateurs

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "IDs utilisateurs requis" });
    }

    const userRole = await getUserRole(userId);

    const project = await prisma.project.findUnique({
      where: { id },
      select: { projectManagerId: true },
    });

    if (!project) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }

    // Vérifier les permissions (ADMIN ou chef du projet)
    const canAdd =
      userRole === "ADMIN" ||
      (userRole === "PROJECT_MANAGER" && project.projectManagerId === userId);

    if (!canAdd) {
      return res
        .status(403)
        .json({
          error:
            "Seul le chef de projet ou un administrateur peut ajouter des membres",
        });
    }

    // Ajouter les membres
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        members: {
          connect: userIds.map((uid: string) => ({ id: uid })),
        },
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.json({
      message: "Membres ajoutés avec succès",
      members: updatedProject.members,
    });
  } catch (error) {
    console.error("Add project members error:", error);
    res.status(500).json({ error: "Erreur lors de l'ajout des membres" });
  }
});

// DELETE /api/projects/:id/members/:userId - Retirer un membre d'un projet
router.delete("/:id/members/:userId", async (req: Request, res: Response) => {
  try {
    const currentUserId = getUserFromRequest(req);
    const { id, userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = await getUserRole(currentUserId);

    const project = await prisma.project.findUnique({
      where: { id },
      select: { projectManagerId: true },
    });

    if (!project) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }

    // Vérifier les permissions
    const canRemove =
      userRole === "ADMIN" ||
      (userRole === "PROJECT_MANAGER" &&
        project.projectManagerId === currentUserId);

    if (!canRemove) {
      return res
        .status(403)
        .json({
          error:
            "Seul le chef de projet ou un administrateur peut retirer des membres",
        });
    }

    // Retirer le membre
    await prisma.project.update({
      where: { id },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
    });

    res.json({ message: "Membre retiré avec succès" });
  } catch (error) {
    console.error("Remove project member error:", error);
    res.status(500).json({ error: "Erreur lors du retrait du membre" });
  }
});

// GET /api/projects/:id/available-members - Liste des utilisateurs pouvant être ajoutés
router.get("/:id/available-members", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = await getUserRole(userId);

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          select: { id: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }

    // Vérifier les permissions
    const canView =
      userRole === "ADMIN" ||
      (userRole === "PROJECT_MANAGER" && project.projectManagerId === userId);

    if (!canView) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    // Récupérer les IDs des membres actuels
    const currentMemberIds = project.members.map((m) => m.id);
    currentMemberIds.push(project.projectManagerId); // Exclure aussi le chef de projet

    // Récupérer les utilisateurs qui ne sont pas encore membres
    const availableUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: currentMemberIds,
        },
        role: "USER", // Seuls les USER peuvent être ajoutés comme membres
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({ users: availableUsers });
  } catch (error) {
    console.error("Get available members error:", error);
    res
      .status(500)
      .json({
        error: "Erreur lors de la récupération des utilisateurs disponibles",
      });
  }
});

export default router;
