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

// POST /api/projects/:projectId/tasks - Créer une tâche
router.post("/:projectId/tasks", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { projectId } = req.params;
    const { title, description, priority, dueDate, assigneeId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    // Validation
    if (!title || !assigneeId) {
      return res.status(400).json({ error: "Titre et assignation requis" });
    }

    const userRole = await getUserRole(userId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          select: { id: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }

    // Vérifier les permissions (ADMIN ou chef du projet)
    const canCreate =
      userRole === "ADMIN" ||
      (userRole === "PROJECT_MANAGER" && project.projectManagerId === userId);

    if (!canCreate) {
      return res
        .status(403)
        .json({
          error:
            "Seul le chef de projet ou un administrateur peut créer des tâches",
        });
    }

    // Vérifier que l'assignee est membre du projet
    const isMember = project.members.some((m) => m.id === assigneeId);
    if (!isMember && assigneeId !== project.projectManagerId) {
      return res
        .status(400)
        .json({ error: "L'utilisateur assigné doit être membre du projet" });
    }

    // Créer la tâche
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        status: "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Tâche créée avec succès",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Erreur lors de la création de la tâche" });
  }
});

// GET /api/projects/:projectId/tasks - Liste des tâches d'un projet
router.get("/:projectId/tasks", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { projectId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = await getUserRole(userId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }

    // Filtrer les tâches selon le rôle
    let tasks = project.tasks;

    if (userRole === "USER") {
      // USER voit uniquement ses tâches
      tasks = tasks.filter((task) => task.assigneeId === userId);
    }

    res.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des tâches" });
  }
});

// PUT /api/tasks/:id - Modifier une tâche
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } =
      req.body;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = await getUserRole(userId);

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            projectManagerId: true,
            members: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!existingTask) {
      return res.status(404).json({ error: "Tâche non trouvée" });
    }

    // Vérifier les permissions
    const isAdmin = userRole === "ADMIN";
    const isProjectManager =
      userRole === "PROJECT_MANAGER" &&
      existingTask.project.projectManagerId === userId;
    const isAssignee = existingTask.assigneeId === userId;

    // USER peut uniquement modifier le statut de ses tâches
    if (userRole === "USER") {
      if (!isAssignee) {
        return res
          .status(403)
          .json({ error: "Vous ne pouvez modifier que vos propres tâches" });
      }

      // USER ne peut modifier que le statut
      if (
        title !== undefined ||
        description !== undefined ||
        priority !== undefined ||
        assigneeId !== undefined
      ) {
        return res
          .status(403)
          .json({
            error: "Vous ne pouvez modifier que le statut de vos tâches",
          });
      }
    }

    // ADMIN et PROJECT_MANAGER peuvent tout modifier
    if (!isAdmin && !isProjectManager && !isAssignee) {
      return res
        .status(403)
        .json({
          error: "Vous n'avez pas la permission de modifier cette tâche",
        });
    }

    // Si changement d'assignee, vérifier qu'il est membre
    if (assigneeId && assigneeId !== existingTask.assigneeId) {
      if (!isAdmin && !isProjectManager) {
        return res
          .status(403)
          .json({ error: "Seul le chef de projet peut réassigner une tâche" });
      }

      const isMember = existingTask.project.members.some(
        (m) => m.id === assigneeId
      );
      if (!isMember && assigneeId !== existingTask.project.projectManagerId) {
        return res
          .status(400)
          .json({ error: "L'utilisateur assigné doit être membre du projet" });
      }
    }

    // Mettre à jour la tâche
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(assigneeId !== undefined && { assigneeId }),
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: "Tâche modifiée avec succès",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la modification de la tâche" });
  }
});

// DELETE /api/tasks/:id - Supprimer une tâche
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = await getUserRole(userId);

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: { projectManagerId: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Tâche non trouvée" });
    }

    // Vérifier les permissions (ADMIN ou chef du projet)
    const canDelete =
      userRole === "ADMIN" ||
      (userRole === "PROJECT_MANAGER" &&
        task.project.projectManagerId === userId);

    if (!canDelete) {
      return res
        .status(403)
        .json({
          error:
            "Seul le chef de projet ou un administrateur peut supprimer une tâche",
        });
    }

    await prisma.task.delete({
      where: { id },
    });

    res.json({ message: "Tâche supprimée avec succès" });
  } catch (error) {
    console.error("Delete task error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la tâche" });
  }
});

export default router;
