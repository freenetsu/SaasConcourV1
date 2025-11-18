// Types pour les événements du calendrier
export type EventType =
  | "meeting"
  | "development"
  | "task"
  | "break"
  | "training"
  | "unavailable";

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: EventType;
  start: string; // ISO date string
  end: string; // ISO date string
  allDay?: boolean;
  color?: string;

  // Lien avec projet/tâche
  projectId?: string;
  taskId?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Configuration des types d'événements
export const eventTypeConfig = {
  meeting: {
    label: "Réunion",
    icon: "🎯",
    color: "#EF4444", // red-500
    bgColor: "#FEE2E2", // red-100
    darkBgColor: "#7F1D1D", // red-900
  },
  development: {
    label: "Développement",
    icon: "💻",
    color: "#3B82F6", // blue-500
    bgColor: "#DBEAFE", // blue-100
    darkBgColor: "#1E3A8A", // blue-900
  },
  task: {
    label: "Tâche",
    icon: "📋",
    color: "#10B981", // green-500
    bgColor: "#D1FAE5", // green-100
    darkBgColor: "#064E3B", // green-900
  },
  break: {
    label: "Pause",
    icon: "🍽️",
    color: "#6B7280", // gray-500
    bgColor: "#F3F4F6", // gray-100
    darkBgColor: "#374151", // gray-700
  },
  training: {
    label: "Formation",
    icon: "🎓",
    color: "#8B5CF6", // violet-500
    bgColor: "#EDE9FE", // violet-100
    darkBgColor: "#5B21B6", // violet-900
  },
  unavailable: {
    label: "Indisponible",
    icon: "🚫",
    color: "#F59E0B", // amber-500
    bgColor: "#FEF3C7", // amber-100
    darkBgColor: "#78350F", // amber-900
  },
};

// Données mockées
// eslint-disable-next-line prefer-const
let mockEvents: CalendarEvent[] = [
  {
    id: "1",
    userId: "1", // Admin
    title: "Daily Standup",
    description: "Réunion quotidienne de l'équipe",
    type: "meeting",
    start: new Date(Date.now()).toISOString().split("T")[0] + "T09:00:00",
    end: new Date(Date.now()).toISOString().split("T")[0] + "T09:15:00",
    allDay: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    userId: "1",
    title: "Focus Dev - Refonte UI",
    description: "Temps de développement concentré",
    type: "development",
    start: new Date(Date.now()).toISOString().split("T")[0] + "T10:00:00",
    end: new Date(Date.now()).toISOString().split("T")[0] + "T12:00:00",
    allDay: false,
    projectId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    userId: "1",
    title: "Pause déjeuner",
    type: "break",
    start: new Date(Date.now()).toISOString().split("T")[0] + "T12:00:00",
    end: new Date(Date.now()).toISOString().split("T")[0] + "T13:00:00",
    allDay: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    userId: "1",
    title: "Review de code",
    description: "Revue du code de l'équipe",
    type: "task",
    start: new Date(Date.now()).toISOString().split("T")[0] + "T14:00:00",
    end: new Date(Date.now()).toISOString().split("T")[0] + "T15:00:00",
    allDay: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    userId: "1",
    title: "Formation React",
    description: "Session de formation sur les hooks avancés",
    type: "training",
    start:
      new Date(Date.now() + 86400000).toISOString().split("T")[0] + "T10:00:00",
    end:
      new Date(Date.now() + 86400000).toISOString().split("T")[0] + "T12:00:00",
    allDay: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Récupérer les événements d'un utilisateur
export async function getUserEvents(userId: string): Promise<CalendarEvent[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return mockEvents
    .filter((event) => event.userId === userId)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

// Créer un événement
export async function createEvent(
  data: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">
): Promise<CalendarEvent> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const newEvent: CalendarEvent = {
    ...data,
    id: String(mockEvents.length + 1),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockEvents.push(newEvent);
  return newEvent;
}

// Mettre à jour un événement
export async function updateEvent(
  eventId: string,
  data: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const eventIndex = mockEvents.findIndex((e) => e.id === eventId);
  if (eventIndex === -1) {
    throw new Error("Événement introuvable");
  }

  mockEvents[eventIndex] = {
    ...mockEvents[eventIndex],
    ...data,
    updatedAt: new Date(),
  };

  return mockEvents[eventIndex];
}

// Supprimer un événement
export async function deleteEvent(eventId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const eventIndex = mockEvents.findIndex((e) => e.id === eventId);
  if (eventIndex !== -1) {
    mockEvents.splice(eventIndex, 1);
  }
}
