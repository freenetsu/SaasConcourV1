// Types pour les rendez-vous
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: AppointmentStatus;
  projectId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Configuration des statuts
export const appointmentStatusConfig = {
  scheduled: {
    label: "Planifié",
    color: "#3B82F6", // blue-500
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    darkBgColor: "dark:bg-blue-900/20",
    darkTextColor: "dark:text-blue-400",
  },
  confirmed: {
    label: "Confirmé",
    color: "#10B981", // green-500
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    darkBgColor: "dark:bg-green-900/20",
    darkTextColor: "dark:text-green-400",
  },
  cancelled: {
    label: "Annulé",
    color: "#EF4444", // red-500
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    darkBgColor: "dark:bg-red-900/20",
    darkTextColor: "dark:text-red-400",
  },
  completed: {
    label: "Terminé",
    color: "#6B7280", // gray-500
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    darkBgColor: "dark:bg-gray-800",
    darkTextColor: "dark:text-gray-400",
  },
};

// Données mockées
// eslint-disable-next-line prefer-const
let mockAppointments: Appointment[] = [
  {
    id: "1",
    title: "Réunion kick-off - Projet Site Web",
    description: "Première réunion pour définir les objectifs du projet",
    startDate: new Date(2025, 0, 20, 10, 0), // 20 Jan 2025, 10h
    endDate: new Date(2025, 0, 20, 11, 0),
    status: "scheduled",
    projectId: "1",
    userId: "user1",
    createdAt: new Date(2025, 0, 15),
    updatedAt: new Date(2025, 0, 15),
  },
  {
    id: "2",
    title: "Démo prototype - Application Mobile",
    description: "Présentation du prototype au client",
    startDate: new Date(2025, 0, 22, 14, 0), // 22 Jan 2025, 14h
    endDate: new Date(2025, 0, 22, 15, 30),
    status: "confirmed",
    projectId: "2",
    userId: "user1",
    createdAt: new Date(2025, 0, 16),
    updatedAt: new Date(2025, 0, 18),
  },
  {
    id: "3",
    title: "Revue mensuelle - Projet Dashboard",
    description: "Point mensuel sur l'avancement du projet",
    startDate: new Date(2025, 0, 25, 9, 0), // 25 Jan 2025, 9h
    endDate: new Date(2025, 0, 25, 10, 0),
    status: "scheduled",
    projectId: "3",
    userId: "user1",
    createdAt: new Date(2025, 0, 17),
    updatedAt: new Date(2025, 0, 17),
  },
  {
    id: "4",
    title: "Formation utilisateurs",
    description: "Session de formation pour les utilisateurs finaux",
    startDate: new Date(2025, 0, 15, 14, 0), // 15 Jan 2025, 14h (passé)
    endDate: new Date(2025, 0, 15, 16, 0),
    status: "completed",
    userId: "user1",
    createdAt: new Date(2025, 0, 10),
    updatedAt: new Date(2025, 0, 15),
  },
];

// Fonctions CRUD

/**
 * Récupérer tous les rendez-vous d'un utilisateur
 */
export const getUserAppointments = async (
  userId: string
): Promise<Appointment[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userAppointments = mockAppointments.filter(
        (apt) => apt.userId === userId
      );
      resolve(userAppointments);
    }, 300);
  });
};

/**
 * Récupérer un rendez-vous par ID
 */
export const getAppointmentById = async (
  id: string
): Promise<Appointment | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const appointment = mockAppointments.find((apt) => apt.id === id);
      resolve(appointment || null);
    }, 200);
  });
};

/**
 * Créer un nouveau rendez-vous
 */
export const createAppointment = async (
  data: Omit<Appointment, "id" | "createdAt" | "updatedAt">
): Promise<Appointment> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newAppointment: Appointment = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockAppointments.push(newAppointment);
      resolve(newAppointment);
    }, 300);
  });
};

/**
 * Mettre à jour un rendez-vous
 */
export const updateAppointment = async (
  id: string,
  data: Partial<Omit<Appointment, "id" | "createdAt" | "updatedAt">>
): Promise<Appointment> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockAppointments.findIndex((apt) => apt.id === id);
      if (index === -1) {
        reject(new Error("Rendez-vous non trouvé"));
        return;
      }

      mockAppointments[index] = {
        ...mockAppointments[index],
        ...data,
        updatedAt: new Date(),
      };

      resolve(mockAppointments[index]);
    }, 300);
  });
};

/**
 * Supprimer un rendez-vous
 */
export const deleteAppointment = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockAppointments.findIndex((apt) => apt.id === id);
      if (index === -1) {
        reject(new Error("Rendez-vous non trouvé"));
        return;
      }

      mockAppointments.splice(index, 1);
      resolve();
    }, 300);
  });
};

/**
 * Changer le statut d'un rendez-vous
 */
export const changeAppointmentStatus = async (
  id: string,
  status: AppointmentStatus
): Promise<Appointment> => {
  return updateAppointment(id, { status });
};
