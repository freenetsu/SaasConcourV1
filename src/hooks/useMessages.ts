import { useEffect, useState } from "react";
import {
  getProjectMessages,
  sendMessage,
  type Message,
} from "../api/mock-messages";

export function useMessages(projectId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Charger les messages
  useEffect(() => {
    if (!projectId) return;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const data = await getProjectMessages(projectId);
        setMessages(data);
      } catch (error) {
        console.error("Erreur lors du chargement des messages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [projectId]);

  // Envoyer un message
  const send = async (content: string, userId: string, userName: string) => {
    if (!content.trim()) return;

    setSending(true);
    try {
      const newMessage = await sendMessage({
        projectId,
        userId,
        userName,
        content: content.trim(),
      });

      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      throw error;
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    sending,
    send,
  };
}
