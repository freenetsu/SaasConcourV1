import { prisma } from "../lib/prisma";

// Types
export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  startDate: Date;
  endDate: Date | null;
  projectManagerId: string;
  createdAt: Date;
  updatedAt: Date;
  projectManager?: {
    id: string;
    name: string;
    email: string;
  };
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: Date | null;
  projectId: string;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
}

// Récupérer tous les projets
export async function getAllProjects(
  userId: string,
  userRole: "ADMIN" | "USER"
): Promise<Project[]> {
  try {
    // Si ADMIN, voir tous les projets
    // Si USER, voir uniquement ses projets (en tant que chef ou membre)
    const where =
      userRole === "ADMIN"
        ? {}
        : {
            OR: [
              { projectManagerId: userId }, // Projets dont il est chef
              { tasks: { some: { assigneeId: userId } } }, // Projets où il a des tâches
            ],
          };

    const projects = await prisma.project.findMany({
      where,
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

    return projects as Project[];
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
}

// Récupérer un projet par ID
export async function getProjectById(
  projectId: string,
  userId: string,
  userRole: "ADMIN" | "USER"
): Promise<Project | null> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    if (!project) return null;

    // Vérifier les permissions
    if (userRole !== "ADMIN") {
      const isManager = project.projectManagerId === userId;
      const hasTasks = project.tasks.some((task) => task.assigneeId === userId);

      if (!isManager && !hasTasks) {
        throw new Error("Unauthorized");
      }
    }

    return project as Project;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
}

// Créer un projet
export async function createProject(data: {
  name: string;
  description?: string;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  startDate: Date;
  endDate?: Date;
  projectManagerId: string;
}): Promise<Project> {
  try {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description || null,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate || null,
        projectManagerId: data.projectManagerId,
      },
      include: {
        projectManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return project as Project;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
}

// Mettre à jour un projet
export async function updateProject(
  projectId: string,
  data: Partial<{
    name: string;
    description: string;
    status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
    startDate: Date;
    endDate: Date;
    projectManagerId: string;
  }>
): Promise<Project> {
  try {
    const project = await prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        projectManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return project as Project;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
}

// Supprimer un projet
export async function deleteProject(projectId: string): Promise<void> {
  try {
    await prisma.project.delete({
      where: { id: projectId },
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
}

// Récupérer les statistiques d'un projet
export async function getProjectStats(projectId: string) {
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: { status: true },
    });

    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === "TODO").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const review = tasks.filter((t) => t.status === "REVIEW").length;
    const done = tasks.filter((t) => t.status === "DONE").length;

    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      total,
      todo,
      inProgress,
      review,
      done,
      progress,
    };
  } catch (error) {
    console.error("Error fetching project stats:", error);
    throw error;
  }
}
