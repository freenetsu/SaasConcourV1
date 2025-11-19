import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:3001/api";

interface Member {
  id: string;
  name: string;
  email: string;
}

interface CreateTaskModalProps {
  projectId: string;
  projectManagerId: string;
  onClose: () => void;
  onTaskCreated: () => void;
}

export default function CreateTaskModal({
  projectId,
  projectManagerId,
  onClose,
  onTaskCreated,
}: CreateTaskModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    assigneeId: "",
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await fetch(`${API_URL}/projects/${projectId}/members`, {
        headers: {
          "x-user-id": user?.id || "",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement");
      }

      setMembers(data.members || []);
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.assigneeId) {
      setError("Le titre et l'assignation sont requis");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      onTaskCreated();
      onClose();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg dark:bg-gray-900">
        <div className="sticky top-0 p-6 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Créer une nouvelle tâche
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Titre */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Titre de la tâche <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Développer la page d'accueil"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Décrivez la tâche en détail..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Priorité et Date */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Priorité */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Priorité
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            {/* Date d'échéance */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Date d'échéance
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Assigner à */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Assigner à <span className="text-red-500">*</span>
            </label>
            <select
              name="assigneeId"
              value={formData.assigneeId}
              onChange={handleChange}
              disabled={loadingMembers}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            >
              <option value="">
                {loadingMembers ? "Chargement..." : "Sélectionner un membre"}
              </option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
            {members.length === 0 && !loadingMembers && (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                ⚠️ Aucun membre dans ce projet. Ajoutez des membres avant de
                créer des tâches.
              </p>
            )}
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="submit"
              disabled={isLoading || members.length === 0}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Création..." : "Créer la tâche"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
