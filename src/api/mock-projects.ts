// Mock data pour les projets (simulation sans backend)
import type { Project } from "./projects";

// Données de test simulées (mutable pour permettre l'ajout)
let mockProjects: Project[] = [
  {
    id: "1",
    name: "Refonte Site Web",
    description:
      "Refonte complète du site web de l'entreprise avec une nouvelle identité visuelle",
    status: "IN_PROGRESS",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-06-30"),
    projectManagerId: "2",
    createdAt: new Date(),
    updatedAt: new Date(),
    projectManager: {
      id: "2",
      name: "Marie Dupont",
      email: "marie@saasconcour.com",
    },
    tasks: [
      {
        id: "1",
        title: "Maquettes UI/UX",
        description: "Créer les maquettes pour toutes les pages du site",
        status: "DONE",
        priority: "HIGH",
        dueDate: new Date("2025-02-15"),
        projectId: "1",
        assigneeId: "3",
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: {
          id: "3",
          name: "Sophie Bernard",
          email: "sophie@saasconcour.com",
        },
      },
      {
        id: "2",
        title: "Développement Frontend",
        description: "Développer les composants React",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: new Date("2025-04-30"),
        projectId: "1",
        assigneeId: "4",
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: {
          id: "4",
          name: "Lucas Petit",
          email: "lucas@saasconcour.com",
        },
      },
      {
        id: "3",
        title: "Intégration API",
        description: "Intégrer les APIs backend",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: new Date("2025-05-15"),
        projectId: "1",
        assigneeId: "5",
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: {
          id: "5",
          name: "Emma Dubois",
          email: "emma@saasconcour.com",
        },
      },
    ],
    _count: {
      tasks: 3,
    },
  },
  {
    id: "2",
    name: "Application Mobile",
    description: "Développement d'une application mobile iOS et Android",
    status: "PLANNING",
    startDate: new Date("2025-03-01"),
    endDate: new Date("2025-12-31"),
    projectManagerId: "4",
    createdAt: new Date(),
    updatedAt: new Date(),
    projectManager: {
      id: "4",
      name: "Thomas Leroy",
      email: "thomas@saasconcour.com",
    },
    tasks: [
      {
        id: "4",
        title: "Spécifications fonctionnelles",
        description: "Rédiger les spécifications détaillées",
        status: "IN_PROGRESS",
        priority: "URGENT",
        dueDate: new Date("2025-03-15"),
        projectId: "2",
        assigneeId: "3",
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: {
          id: "3",
          name: "Sophie Bernard",
          email: "sophie@saasconcour.com",
        },
      },
      {
        id: "5",
        title: "Architecture technique",
        description: "Définir l'architecture de l'application",
        status: "TODO",
        priority: "HIGH",
        dueDate: new Date("2025-04-01"),
        projectId: "2",
        assigneeId: "4",
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: {
          id: "4",
          name: "Lucas Petit",
          email: "lucas@saasconcour.com",
        },
      },
    ],
    _count: {
      tasks: 2,
    },
  },
  {
    id: "3",
    name: "Migration Cloud",
    description: "Migration de l'infrastructure vers AWS",
    status: "IN_PROGRESS",
    startDate: new Date("2025-02-01"),
    endDate: new Date("2025-08-31"),
    projectManagerId: "2",
    createdAt: new Date(),
    updatedAt: new Date(),
    projectManager: {
      id: "2",
      name: "Marie Dupont",
      email: "marie@saasconcour.com",
    },
    tasks: [
      {
        id: "6",
        title: "Audit infrastructure",
        description: "Auditer l'infrastructure actuelle",
        status: "DONE",
        priority: "HIGH",
        dueDate: new Date("2025-02-28"),
        projectId: "3",
        assigneeId: "5",
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: {
          id: "5",
          name: "Emma Dubois",
          email: "emma@saasconcour.com",
        },
      },
      {
        id: "7",
        title: "Configuration AWS",
        description: "Configurer les services AWS",
        status: "IN_PROGRESS",
        priority: "URGENT",
        dueDate: new Date("2025-04-15"),
        projectId: "3",
        assigneeId: "4",
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: {
          id: "4",
          name: "Lucas Petit",
          email: "lucas@saasconcour.com",
        },
      },
      {
        id: "8",
        title: "Tests de migration",
        description: "Effectuer les tests de migration",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: new Date("2025-06-30"),
        projectId: "3",
        assigneeId: "3",
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: {
          id: "3",
          name: "Sophie Bernard",
          email: "sophie@saasconcour.com",
        },
      },
    ],
    _count: {
      tasks: 3,
    },
  },
  {
    id: "4",
    name: "Système CRM",
    description: "Implémentation d'un nouveau système CRM",
    status: "COMPLETED",
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-12-31"),
    projectManagerId: "4",
    createdAt: new Date(),
    updatedAt: new Date(),
    projectManager: {
      id: "4",
      name: "Thomas Leroy",
      email: "thomas@saasconcour.com",
    },
    tasks: [],
    _count: {
      tasks: 0,
    },
  },
];

// Simuler les appels API
export async function getAllProjects(
  userId: string,
  userRole: "ADMIN" | "USER"
): Promise<Project[]> {
  // Simuler un délai réseau
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (userRole === "ADMIN") {
    return mockProjects;
  }

  // Filtrer les projets pour les USER
  return mockProjects.filter((project) => {
    const isManager = project.projectManagerId === userId;
    const hasTasks = project.tasks?.some((task) => task.assigneeId === userId);
    return isManager || hasTasks;
  });
}

export async function getProjectById(
  projectId: string,
  userId: string,
  userRole: "ADMIN" | "USER"
): Promise<Project | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const project = mockProjects.find((p) => p.id === projectId);

  if (!project) return null;

  // Vérifier les permissions
  if (userRole !== "ADMIN") {
    const isManager = project.projectManagerId === userId;
    const hasTasks = project.tasks?.some((task) => task.assigneeId === userId);

    if (!isManager && !hasTasks) {
      throw new Error("Unauthorized");
    }
  }

  return project;
}

export async function getProjectStats(projectId: string) {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const project = mockProjects.find((p) => p.id === projectId);
  if (!project) return null;

  const tasks = project.tasks || [];
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
}

// Fonction pour créer un nouveau projet
export async function createProject(data: {
  name: string;
  description?: string;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate?: string;
  projectManagerId: string;
}): Promise<Project> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Trouver le chef de projet
  const managers = [
    { id: "2", name: "Marie Dupont", email: "marie@saasconcour.com" },
    { id: "3", name: "Sophie Bernard", email: "sophie@saasconcour.com" },
    { id: "4", name: "Thomas Leroy", email: "thomas@saasconcour.com" },
    { id: "5", name: "Lucas Petit", email: "lucas@saasconcour.com" },
    { id: "6", name: "Emma Dubois", email: "emma@saasconcour.com" },
  ];

  const manager = managers.find((m) => m.id === data.projectManagerId);
  if (!manager) {
    throw new Error("Chef de projet introuvable");
  }

  // Créer le nouveau projet
  const newProject: Project = {
    id: String(mockProjects.length + 1),
    name: data.name,
    description: data.description || "",
    status: data.status,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
    projectManagerId: data.projectManagerId,
    createdAt: new Date(),
    updatedAt: new Date(),
    projectManager: manager,
    tasks: [],
    _count: {
      tasks: 0,
    },
  };

  // Ajouter à la liste
  mockProjects.push(newProject);

  return newProject;
}

// Fonction pour mettre à jour un projet
export async function updateProject(
  projectId: string,
  data: {
    name?: string;
    description?: string;
    status?: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
    startDate?: string;
    endDate?: string;
    projectManagerId?: string;
  }
): Promise<Project> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const projectIndex = mockProjects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) {
    throw new Error("Projet introuvable");
  }

  const project = mockProjects[projectIndex];

  // Mettre à jour les champs
  if (data.name !== undefined) project.name = data.name;
  if (data.description !== undefined) project.description = data.description;
  if (data.status !== undefined) project.status = data.status;
  if (data.startDate !== undefined)
    project.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) {
    project.endDate = data.endDate ? new Date(data.endDate) : null;
  }
  if (data.projectManagerId !== undefined) {
    project.projectManagerId = data.projectManagerId;

    // Mettre à jour le chef de projet
    const managers = [
      { id: "2", name: "Marie Dupont", email: "marie@saasconcour.com" },
      { id: "3", name: "Sophie Bernard", email: "sophie@saasconcour.com" },
      { id: "4", name: "Thomas Leroy", email: "thomas@saasconcour.com" },
      { id: "5", name: "Lucas Petit", email: "lucas@saasconcour.com" },
      { id: "6", name: "Emma Dubois", email: "emma@saasconcour.com" },
    ];
    const manager = managers.find((m) => m.id === data.projectManagerId);
    if (manager) {
      project.projectManager = manager;
    }
  }

  project.updatedAt = new Date();

  return project;
}

// Fonction pour supprimer un projet
export async function deleteProject(projectId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const projectIndex = mockProjects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) {
    throw new Error("Projet introuvable");
  }

  mockProjects.splice(projectIndex, 1);
}
