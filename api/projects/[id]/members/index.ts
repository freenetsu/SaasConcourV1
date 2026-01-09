import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const prisma = new PrismaClient();

const getUserIdFromRequest = (req: VercelRequest): string | null => {
  return (req.headers["x-user-id"] as string) || null;
};

const getUserRole = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  const { id } = req.query;
  const projectId = Array.isArray(id) ? id[0] : id;

  if (!projectId) {
    return res.status(400).json({ error: "ID du projet requis" });
  }

  if (req.method === "GET") {
    try {
      const userRole = await getUserRole(userId);

      const project = await prisma.project.findUnique({
        where: { id: projectId },
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

      const canView =
        userRole === "ADMIN" ||
        (userRole === "PROJECT_MANAGER" &&
          project.projectManagerId === userId);

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
  } else if (req.method === "POST") {
    try {
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "IDs utilisateurs requis" });
      }

      const userRole = await getUserRole(userId);

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { projectManagerId: true },
      });

      if (!project) {
        return res.status(404).json({ error: "Projet non trouvé" });
      }

      const canAdd =
        userRole === "ADMIN" ||
        (userRole === "PROJECT_MANAGER" &&
          project.projectManagerId === userId);

      if (!canAdd) {
        return res.status(403).json({
          error:
            "Seul le chef de projet ou un administrateur peut ajouter des membres",
        });
      }

      const updatedProject = await prisma.project.update({
        where: { id: projectId },
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
  } else {
    res.status(405).json({ error: "Méthode non autorisée" });
  }
}
