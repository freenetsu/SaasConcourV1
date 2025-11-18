// Types pour les messages
export interface Message {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
}

// Données mockées
// eslint-disable-next-line prefer-const
let mockMessages: Message[] = [
  {
    id: "1",
    projectId: "1",
    userId: "2",
    userName: "Marie Dupont",
    content: "Bonjour à tous ! Le projet avance bien, on est dans les temps 🎉",
    createdAt: new Date("2025-01-15T10:30:00"),
  },
  {
    id: "2",
    projectId: "1",
    userId: "5",
    userName: "Lucas Petit",
    content: "Super ! J'ai terminé la maquette de la page d'accueil.",
    createdAt: new Date("2025-01-15T11:15:00"),
  },
  {
    id: "3",
    projectId: "1",
    userId: "2",
    userName: "Marie Dupont",
    content: "Parfait Lucas ! Tu peux la partager sur Figma ?",
    createdAt: new Date("2025-01-15T11:20:00"),
  },
  {
    id: "4",
    projectId: "2",
    userId: "4",
    userName: "Thomas Leroy",
    content: "Réunion demain à 14h pour discuter de l'architecture backend",
    createdAt: new Date("2025-01-16T09:00:00"),
  },
  {
    id: "5",
    projectId: "2",
    userId: "6",
    userName: "Emma Dubois",
    content: "OK pour moi ! Je prépare les specs techniques.",
    createdAt: new Date("2025-01-16T09:30:00"),
  },
];

// Récupérer les messages d'un projet
export async function getProjectMessages(
  projectId: string
): Promise<Message[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return mockMessages
    .filter((msg) => msg.projectId === projectId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

// Envoyer un message
export async function sendMessage(data: {
  projectId: string;
  userId: string;
  userName: string;
  content: string;
}): Promise<Message> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const newMessage: Message = {
    id: String(mockMessages.length + 1),
    projectId: data.projectId,
    userId: data.userId,
    userName: data.userName,
    content: data.content,
    createdAt: new Date(),
  };

  mockMessages.push(newMessage);
  return newMessage;
}

// Supprimer un message (optionnel)
export async function deleteMessage(messageId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const index = mockMessages.findIndex((msg) => msg.id === messageId);
  if (index !== -1) {
    mockMessages.splice(index, 1);
  }
}
