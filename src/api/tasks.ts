import { prisma } from "../lib/prisma";
import type { Task } from "./projects";

// Créer une tâche
export async function createTask(data: {
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: Date;
  projectId: string;
  assigneeId?: string;
}): Promise<Task> {
  try {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate || null,
        projectId: data.projectId,
        assigneeId: data.assigneeId || null,
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

    return task as Task;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

// Mettre à jour une tâche
export async function updateTask(
  taskId: string,
  data: Partial<{
    title: string;
    description: string;
    status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate: Date;
    assigneeId: string;
  }>
): Promise<Task> {
  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data,
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

    return task as Task;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}

// Supprimer une tâche
export async function deleteTask(taskId: string): Promise<void> {
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
}

// Récupérer les tâches d'un utilisateur
export async function getUserTasks(userId: string): Promise<Task[]> {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: userId },
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
    });

    return tasks as Task[];
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    throw error;
  }
}
