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

// Google Calendar inspired color palette
export const eventTypeConfig: Record<string, { label: string; icon: string; color: string; bgColor: string; darkBgColor: string }> = {
  meeting: {
    label: "Réunion",
    icon: "👥",
    color: "#d50000",
    bgColor: "#f28b82",
    darkBgColor: "#c53929",
  },
  development: {
    label: "Développement",
    icon: "💻",
    color: "#039be5",
    bgColor: "#7cb6f8",
    darkBgColor: "#0277bd",
  },
  task: {
    label: "Tâche",
    icon: "✓",
    color: "#0b8043",
    bgColor: "#57bb8a",
    darkBgColor: "#1b5e20",
  },
  break: {
    label: "Pause",
    icon: "☕",
    color: "#616161",
    bgColor: "#a8a8a8",
    darkBgColor: "#424242",
  },
  training: {
    label: "Formation",
    icon: "📚",
    color: "#8e24aa",
    bgColor: "#b39ddb",
    darkBgColor: "#6a1b9a",
  },
  unavailable: {
    label: "Indisponible",
    icon: "⛔",
    color: "#f4511e",
    bgColor: "#ffab91",
    darkBgColor: "#d84315",
  },
  MEETING: {
    label: "Réunion",
    icon: "👥",
    color: "#d50000",
    bgColor: "#f28b82",
    darkBgColor: "#c53929",
  },
  DEADLINE: {
    label: "Échéance",
    icon: "⏰",
    color: "#e67c73",
    bgColor: "#f28b82",
    darkBgColor: "#c53929",
  },
  REMINDER: {
    label: "Rappel",
    icon: "🔔",
    color: "#f6bf26",
    bgColor: "#fdd663",
    darkBgColor: "#f9a825",
  },
  OTHER: {
    label: "Autre",
    icon: "📅",
    color: "#7986cb",
    bgColor: "#aab6fe",
    darkBgColor: "#5c6bc0",
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
