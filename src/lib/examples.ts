/**
 * Exemples d'utilisation de Prisma dans l'application
 *
 * Note: Ces exemples sont destinés à être utilisés côté serveur uniquement.
 * Pour une application React pure (frontend), vous devrez créer une API backend
 * (Express, Next.js API routes, etc.) qui utilise Prisma.
 */

import { prisma } from "./prisma";

// ============================================
// EXEMPLES - USERS (Utilisateurs)
// ============================================

/**
 * Récupérer tous les utilisateurs
 */
export async function getAllUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Récupérer un utilisateur par ID avec ses relations
 */
export async function getUserWithRelations(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      managedProjects: true,
      assignedTasks: {
        include: {
          project: true,
        },
      },
      events: true,
      appointments: {
        include: {
          client: true,
        },
      },
    },
  });
}

/**
 * Créer un nouvel utilisateur
 */
export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  role?: "ADMIN" | "MANAGER" | "EMPLOYEE";
}) {
  return await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: data.password, // Assurez-vous de hasher le mot de passe avant !
      role: data.role || "EMPLOYEE",
    },
  });
}

// ============================================
// EXEMPLES - PROJECTS (Projets)
// ============================================

/**
 * Récupérer tous les projets avec leur manager
 */
export async function getAllProjects() {
  return await prisma.project.findMany({
    include: {
      projectManager: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Récupérer un projet avec toutes ses tâches
 */
export async function getProjectWithTasks(projectId: string) {
  return await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectManager: true,
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
          dueDate: "asc",
        },
      },
    },
  });
}

/**
 * Créer un nouveau projet
 */
export async function createProject(data: {
  name: string;
  description?: string;
  status?: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  startDate?: Date;
  endDate?: Date;
  projectManagerId: string;
}) {
  return await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      status: data.status || "PLANNING",
      startDate: data.startDate,
      endDate: data.endDate,
      projectManagerId: data.projectManagerId,
    },
    include: {
      projectManager: true,
    },
  });
}

/**
 * Mettre à jour le statut d'un projet
 */
export async function updateProjectStatus(
  projectId: string,
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED"
) {
  return await prisma.project.update({
    where: { id: projectId },
    data: { status },
  });
}

// ============================================
// EXEMPLES - TASKS (Tâches)
// ============================================

/**
 * Récupérer les tâches d'un utilisateur
 */
export async function getUserTasks(userId: string) {
  return await prisma.task.findMany({
    where: { assigneeId: userId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
  });
}

/**
 * Créer une nouvelle tâche
 */
export async function createTask(data: {
  title: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: Date;
  projectId: string;
  assigneeId: string;
}) {
  return await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status || "TODO",
      priority: data.priority || "MEDIUM",
      dueDate: data.dueDate,
      projectId: data.projectId,
      assigneeId: data.assigneeId,
    },
    include: {
      project: true,
      assignee: true,
    },
  });
}

/**
 * Mettre à jour le statut d'une tâche
 */
export async function updateTaskStatus(
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
) {
  return await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });
}

/**
 * Récupérer les tâches par statut
 */
export async function getTasksByStatus(
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
) {
  return await prisma.task.findMany({
    where: { status },
    include: {
      project: true,
      assignee: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

// ============================================
// EXEMPLES - EVENTS (Événements)
// ============================================

/**
 * Récupérer les événements d'un utilisateur
 */
export async function getUserEvents(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  return await prisma.event.findMany({
    where: {
      userId,
      ...(startDate && endDate
        ? {
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {}),
    },
    orderBy: {
      startDate: "asc",
    },
  });
}

/**
 * Créer un nouvel événement
 */
export async function createEvent(data: {
  title: string;
  description?: string;
  type?: "MEETING" | "DEADLINE" | "REMINDER" | "OTHER";
  startDate: Date;
  endDate: Date;
  userId: string;
}) {
  return await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      type: data.type || "OTHER",
      startDate: data.startDate,
      endDate: data.endDate,
      userId: data.userId,
    },
  });
}

// ============================================
// EXEMPLES - CLIENTS
// ============================================

/**
 * Récupérer tous les clients
 */
export async function getAllClients() {
  return await prisma.client.findMany({
    include: {
      _count: {
        select: {
          appointments: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Créer un nouveau client
 */
export async function createClient(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
}) {
  return await prisma.client.create({
    data,
  });
}

// ============================================
// EXEMPLES - APPOINTMENTS (Rendez-vous)
// ============================================

/**
 * Récupérer les rendez-vous d'un utilisateur
 */
export async function getUserAppointments(userId: string) {
  return await prisma.appointment.findMany({
    where: { userId },
    include: {
      client: true,
    },
    orderBy: {
      startDate: "asc",
    },
  });
}

/**
 * Récupérer les rendez-vous d'un client
 */
export async function getClientAppointments(clientId: string) {
  return await prisma.appointment.findMany({
    where: { clientId },
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
  });
}

/**
 * Créer un nouveau rendez-vous
 */
export async function createAppointment(data: {
  title: string;
  description?: string;
  status?: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  startDate: Date;
  endDate: Date;
  location?: string;
  clientId: string;
  userId: string;
}) {
  return await prisma.appointment.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status || "SCHEDULED",
      startDate: data.startDate,
      endDate: data.endDate,
      location: data.location,
      clientId: data.clientId,
      userId: data.userId,
    },
    include: {
      client: true,
      user: true,
    },
  });
}

// ============================================
// EXEMPLES - REQUÊTES COMPLEXES
// ============================================

/**
 * Dashboard : Statistiques globales
 */
export async function getDashboardStats() {
  const [
    totalUsers,
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    totalClients,
    upcomingAppointments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.project.count({
      where: { status: "IN_PROGRESS" },
    }),
    prisma.task.count(),
    prisma.task.count({
      where: { status: "DONE" },
    }),
    prisma.client.count(),
    prisma.appointment.count({
      where: {
        startDate: {
          gte: new Date(),
        },
        status: {
          in: ["SCHEDULED", "CONFIRMED"],
        },
      },
    }),
  ]);

  return {
    users: totalUsers,
    projects: {
      total: totalProjects,
      active: activeProjects,
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    },
    clients: totalClients,
    upcomingAppointments,
  };
}

/**
 * Recherche globale
 */
export async function globalSearch(query: string) {
  const [projects, tasks, clients] = await Promise.all([
    prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        project: true,
      },
      take: 5,
    }),
    prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { company: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
  ]);

  return {
    projects,
    tasks,
    clients,
  };
}
