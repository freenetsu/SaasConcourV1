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
  const { id } = req.query;

  if (!userId) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "ID de projet invalide" });
  }

  try {
    if (req.method === "GET") {
      // Récupérer un projet spécifique
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
          _count: {
            select: { tasks: true },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Projet non trouvé" });
      }

      // Vérifier les permissions
      const userRole = await getUserRole(userId);
      if (userRole !== "ADMIN") {
        const isManager = project.projectManagerId === userId;
        const hasTasks = project.tasks.some(
          (task) => task.assigneeId === userId
        );

        if (!isManager && !hasTasks) {
          return res.status(403).json({ error: "Accès refusé" });
        }
      }

      return res.json({ project });
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      // Mettre à jour un projet
      const userRole = await getUserRole(userId);

      if (userRole !== "ADMIN") {
        return res
          .status(403)
          .json({ error: "Seul un administrateur peut modifier un projet" });
      }

      const {
        name,
        description,
        status,
        startDate,
        endDate,
        projectManagerId,
      } = req.body;

      const project = await prisma.project.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(status && { status }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate !== undefined && {
            endDate: endDate ? new Date(endDate) : null,
          }),
          ...(projectManagerId && { projectManagerId }),
        },
        include: {
          projectManager: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return res.json({ message: "Projet mis à jour avec succès", project });
    }

    if (req.method === "DELETE") {
      // Supprimer un projet
      const userRole = await getUserRole(userId);

      if (userRole !== "ADMIN") {
        return res
          .status(403)
          .json({ error: "Seul un administrateur peut supprimer un projet" });
      }

      await prisma.project.delete({
        where: { id },
      });

      return res.json({ message: "Projet supprimé avec succès" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Project detail error:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
