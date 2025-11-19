import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import CreateTaskModal from "./CreateTaskModal";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: Date | string | null;
  assignee: {
    id: string;
    name: string;
    email: string;
  };
}

interface TasksListProps {
  projectId: string;
  projectManagerId: string;
}

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

const priorityLabels: Record<string, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  URGENT: "Urgente",
};

const statusColors: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  IN_PROGRESS:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  REVIEW:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
};

const statusLabels: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  REVIEW: "En revue",
  DONE: "Terminé",
};

export default function TasksList({
  projectId,
  projectManagerId,
}: TasksListProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const isProjectManager = user?.id === projectManagerId;
  const canManage = isAdmin || isProjectManager;

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
        headers: {
          "x-user-id": user?.id || "",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement");
      }

      setTasks(data.tasks || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Erreur lors du chargement des tâches");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      // Mettre à jour localement
      setTasks(
        tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      const error = err as Error;
      alert(error.message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user?.id || "",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err) {
      const error = err as Error;
      alert(error.message);
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Pas de date";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  if (isLoading) {
    return (
      <div className="text-gray-500 dark:text-gray-400">
        Chargement des tâches...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tâches ({tasks.length})
        </h3>
        {canManage && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
          >
            + Nouvelle tâche
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Liste des tâches */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune tâche dans ce projet.{" "}
            {canManage && "Créez la première tâche !"}
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
                {canManage && (
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    priorityColors[task.priority] || priorityColors.MEDIUM
                  }`}
                >
                  {priorityLabels[task.priority] || task.priority}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    statusColors[task.status] || statusColors.TODO
                  }`}
                >
                  {statusLabels[task.status] || task.status}
                </span>
                {task.dueDate && (
                  <span className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded dark:bg-gray-700 dark:text-gray-300">
                    📅 {formatDate(task.dueDate)}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/20">
                    <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                      {task.assignee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {task.assignee.name}
                  </span>
                </div>

                {/* Changement de statut */}
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-200 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="TODO">À faire</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="REVIEW">En revue</option>
                  <option value="DONE">Terminé</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <CreateTaskModal
          projectId={projectId}
          projectManagerId={projectManagerId}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={fetchTasks}
        />
      )}
    </div>
  );
}
