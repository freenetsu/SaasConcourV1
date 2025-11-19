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

// GET /api/clients - Liste des clients
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const clients = await prisma.client.findMany({
      include: {
        appointments: {
          select: {
            id: true,
            title: true,
            startDate: true,
            status: true,
          },
          orderBy: {
            startDate: "desc",
          },
          take: 5,
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ clients });
  } catch (error) {
    console.error("Get clients error:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des clients" });
  }
});

// GET /api/clients/:id - Détails d'un client
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
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
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: "Client non trouvé" });
    }

    res.json({ client });
  } catch (error) {
    console.error("Get client error:", error);
    res.status(500).json({ error: "Erreur lors de la récupération du client" });
  }
});

// POST /api/clients - Créer un client
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { name, email, phone, company, address, notes } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    // Validation
    if (!name || !email) {
      return res.status(400).json({ error: "Nom et email requis" });
    }

    // Vérifier si l'email existe déjà
    const existingClient = await prisma.client.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingClient) {
      return res
        .status(409)
        .json({ error: "Un client avec cet email existe déjà" });
    }

    const client = await prisma.client.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        phone,
        company,
        address,
        notes,
      },
    });

    res.status(201).json({
      message: "Client créé avec succès",
      client,
    });
  } catch (error) {
    console.error("Create client error:", error);
    res.status(500).json({ error: "Erreur lors de la création du client" });
  }
});

// PUT /api/clients/:id - Modifier un client
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;
    const { name, email, phone, company, address, notes } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return res.status(404).json({ error: "Client non trouvé" });
    }

    // Si l'email change, vérifier qu'il n'existe pas déjà
    if (email && email !== existingClient.email) {
      const emailExists = await prisma.client.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (emailExists) {
        return res
          .status(409)
          .json({ error: "Un client avec cet email existe déjà" });
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email: email.toLowerCase().trim() }),
        ...(phone !== undefined && { phone }),
        ...(company !== undefined && { company }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json({
      message: "Client modifié avec succès",
      client,
    });
  } catch (error) {
    console.error("Update client error:", error);
    res.status(500).json({ error: "Erreur lors de la modification du client" });
  }
});

// DELETE /api/clients/:id - Supprimer un client
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserFromRequest(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const userRole = await getUserRole(userId);

    // Seul ADMIN peut supprimer des clients
    if (userRole !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Seul un administrateur peut supprimer un client" });
    }

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return res.status(404).json({ error: "Client non trouvé" });
    }

    await prisma.client.delete({
      where: { id },
    });

    res.json({ message: "Client supprimé avec succès" });
  } catch (error) {
    console.error("Delete client error:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du client" });
  }
});

export default router;
