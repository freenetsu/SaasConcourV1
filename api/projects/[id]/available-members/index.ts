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

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
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

  try {
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

    const canView =
      userRole === "ADMIN" ||
      (userRole === "PROJECT_MANAGER" && project.projectManagerId === userId);

    if (!canView) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const currentMemberIds = project.members.map((m) => m.id);
    currentMemberIds.push(project.projectManagerId);

    const availableUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: currentMemberIds,
        },
        role: "USER",
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
    res.status(500).json({
      error: "Erreur lors de la récupération des utilisateurs disponibles",
    });
  }
}
