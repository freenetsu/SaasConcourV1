import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";

const router = Router();
const prisma = new PrismaClient();

// Middleware pour vérifier l'authentification (à implémenter avec JWT plus tard)
// Pour l'instant, on suppose que userId est passé dans les headers
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

// GET /api/projects - Liste des projets selon le rôle
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = await getUserRole(userId);

    let projects;

    if (userRole === "ADMIN") {
      // ADMIN voit tous les projets
      projects = await prisma.project.findMany({
        include: {
          projectManager: {
            select: { id: true, name: true, email: true },
          },
          tasks: {
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (userRole === "PROJECT_MANAGER") {
      // PROJECT_MANAGER voit ses projets
      projects = await prisma.project.findMany({
        where: { projectManagerId: userId },
        include: {
          projectManager: {
            select: { id: true, name: true, email: true },
          },
          tasks: {
            select: { id: true, status: true, assigneeId: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // USER voit les projets où il a des tâches
      projects = await prisma.project.findMany({
        where: {
          tasks: {
            some: { assigneeId: userId },
          },
        },
        include: {
          projectManager: {
            select: { id: true, name: true, email: true },
          },
          tasks: {
            where: { assigneeId: userId },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    res.json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des projets" });
  }
});

// GET /api/projects/:id - Détails d'un projet
router.get("/:id", async (req: Request, res: Response) => {
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
        projectManager: {
          select: { id: true, name: true, email: true, role: true },
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }

    // Vérifier les permissions
    const canView =
      userRole === "ADMIN" ||
      (userRole === "PROJECT_MANAGER" && project.projectManagerId === userId) ||
      (userRole === "USER" &&
        project.tasks.some((task) => task.assigneeId === userId));

    if (!canView) {
      return res.status(403).json({ error: "Accès refusé à ce projet" });
    }

    // Si USER, ne montrer que ses tâches
    if (userRole === "USER") {
      project.tasks = project.tasks.filter(
        (task) => task.assigneeId === userId
      );
    }

    res.json({ project });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ error: "Erreur lors de la récupération du projet" });
  }
});

// POST /api/projects - Créer un projet (ADMIN uniquement)
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = await getUserRole(userId);

    if (userRole !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Seul un administrateur peut créer un projet" });
    }

    const { name, description, status, startDate, endDate, projectManagerId } =
      req.body;

    // Validation
    if (!name || !projectManagerId) {
      return res.status(400).json({ error: "Nom et chef de projet requis" });
    }

    // Vérifier que le projectManager existe et a le bon rôle
    const projectManager = await prisma.user.findUnique({
      where: { id: projectManagerId },
    });

    if (!projectManager) {
      return res.status(404).json({ error: "Chef de projet non trouvé" });
    }

    if (
      projectManager.role !== "PROJECT_MANAGER" &&
      projectManager.role !== "ADMIN"
    ) {
      return res.status(400).json({
        error:
          "L'utilisateur sélectionné doit avoir le rôle PROJECT_MANAGER ou ADMIN",
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || "PLANNING",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        projectManagerId,
      },
      include: {
        projectManager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({
      message: "Projet créé avec succès",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ error: "Erreur lors de la création du projet" });
  }
});

// PUT /api/projects/:id - Modifier un projet
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = await getUserRole(userId);

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json({ error: "Projet non trouvé" });
    }

    // Vérifier les permissions
    const canEdit =
      userRole === "ADMIN" ||
      (userRole === "PROJECT_MANAGER" &&
        existingProject.projectManagerId === userId);

    if (!canEdit) {
      return res
        .status(403)
        .json({ error: "Vous ne pouvez pas modifier ce projet" });
    }

    const { name, description, status, startDate, endDate, projectManagerId } =
      req.body;

    // Seul ADMIN peut changer le projectManager
    if (
      projectManagerId &&
      projectManagerId !== existingProject.projectManagerId
    ) {
      if (userRole !== "ADMIN") {
        return res.status(403).json({
          error: "Seul un administrateur peut réassigner un projet",
        });
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(projectManagerId && { projectManagerId }),
      },
      include: {
        projectManager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({
      message: "Projet modifié avec succès",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Erreur lors de la modification du projet" });
  }
});

// DELETE /api/projects/:id - Supprimer un projet (ADMIN uniquement)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = await getUserRole(userId);

    if (userRole !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Seul un administrateur peut supprimer un projet" });
    }

    await prisma.project.delete({
      where: { id },
    });

    res.json({ message: "Projet supprimé avec succès" });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du projet" });
  }
});

export default router;
