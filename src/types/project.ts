// Types pour les projets (utilisables côté client)
export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  startDate: Date | string;
  endDate: Date | string | null;
  projectManagerId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  projectManager?: {
    id: string;
    name: string;
    email: string;
    role?: string;
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
  dueDate: Date | string | null;
  projectId: string;
  assigneeId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
}

export type ProjectStatus = Project["status"];
export type TaskStatus = Task["status"];
export type TaskPriority = Task["priority"];
