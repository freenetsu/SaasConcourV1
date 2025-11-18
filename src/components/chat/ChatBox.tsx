import { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useMessages } from "../../hooks/useMessages";
import Message from "./Message";
import MessageInput from "./MessageInput";

interface ChatBoxProps {
  projectId: string;
}

export default function ChatBox({ projectId }: ChatBoxProps) {
  const { user } = useAuth();
  const { messages, loading, sending, send } = useMessages(projectId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!user) return;

    try {
      await send(content, user.id, user.name);
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600 dark:text-gray-400">
          Chargement des messages...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Discussion
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {messages.length} message{messages.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="mb-2 text-gray-600 dark:text-gray-400">
                Aucun message pour le moment
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Soyez le premier à écrire !
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                isOwn={message.userId === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
