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

// GET /api/users/project-managers - Liste des PROJECT_MANAGER (pour ADMIN)
router.get("/project-managers", async (req: Request, res: Response) => {
  try {
    console.log("🔍 GET /api/users/project-managers");
    const userId = getUserFromRequest(req);
    console.log("👤 User ID:", userId);

    if (!userId) {
      console.log("❌ No user ID");
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = await getUserRole(userId);
    console.log("🎭 User role:", userRole);

    // Seul ADMIN peut voir la liste des PROJECT_MANAGER
    if (userRole !== "ADMIN") {
      console.log("❌ User is not ADMIN");
      return res.status(403).json({ error: "Accès refusé" });
    }

    console.log("📋 Fetching project managers...");
    const projectManagers = await prisma.user.findMany({
      where: {
        OR: [{ role: "PROJECT_MANAGER" }, { role: "ADMIN" }],
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

    console.log(`✅ Found ${projectManagers.length} managers`);
    res.json({ users: projectManagers });
  } catch (error) {
    console.error("❌ Get project managers error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des chefs de projet" });
  }
});

// GET /api/users - Liste de tous les utilisateurs (pour ADMIN)
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = await getUserRole(userId);

    // Seul ADMIN peut voir tous les utilisateurs
    if (userRole !== "ADMIN") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des utilisateurs" });
  }
});

export default router;
