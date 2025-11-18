import type { Message as MessageType } from "../../api/mock-messages";

interface MessageProps {
  message: MessageType;
  isOwn: boolean;
}

export default function Message({ message, isOwn }: MessageProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-brand-500">
          {message.userName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Contenu du message */}
      <div
        className={`flex-1 max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}
      >
        {/* Nom et heure */}
        {!isOwn && (
          <div className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
            {message.userName}
          </div>
        )}

        {/* Bulle de message */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? "bg-brand-500 text-white rounded-br-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Heure */}
        <div
          className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${
            isOwn ? "text-right" : "text-left"
          }`}
        >
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
