import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

const getUserFromRequest = (req: VercelRequest): string | null => {
  return (req.headers["x-user-id"] as string) || null;
};

const getUserRole = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role;
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
      // Liste des projets
      const userRole = await getUserRole(userId);
      let projects;

      if (userRole === "ADMIN") {
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

      return res.json({ projects });
    }

    if (req.method === "POST") {
      // Créer un projet
      const userRole = await getUserRole(userId);

      if (userRole !== "ADMIN") {
        return res
          .status(403)
          .json({ error: "Seul un administrateur peut créer un projet" });
      }

      const {
        name,
        description,
        status,
        startDate,
        endDate,
        projectManagerId,
      } = req.body;

      if (!name || !projectManagerId) {
        return res.status(400).json({ error: "Nom et chef de projet requis" });
      }

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

      return res.status(201).json({
        message: "Projet créé avec succès",
        project,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Projects error:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
