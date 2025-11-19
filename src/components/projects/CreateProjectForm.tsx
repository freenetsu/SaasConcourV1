import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { canCreateProject } from "../../lib/permissions";
import Label from "../form/Label";
import Input from "../form/input/InputField";

interface ProjectManager {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function CreateProjectForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    startDate: "",
    endDate: "",
    projectManagerId: "",
  });
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier les permissions
  const canCreate = user ? canCreateProject(user) : false;

  useEffect(() => {
    if (!canCreate) {
      navigate("/projects");
      return;
    }
    fetchProjectManagers();
  }, [canCreate, navigate]);

  const fetchProjectManagers = async () => {
    try {
      // TODO: Créer une API pour récupérer les PROJECT_MANAGER
      // Pour l'instant, on simule
      setProjectManagers([
        {
          id: user?.id || "",
          name: user?.name || "",
          email: user?.email || "",
          role: "ADMIN",
        },
      ]);
    } catch (err) {
      console.error("Error fetching project managers:", err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
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

    if (!formData.name || !formData.projectManagerId) {
      setError("Le nom et le chef de projet sont requis");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création du projet");
      }

      // Rediriger vers la liste des projets
      navigate("/projects");
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canCreate) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Créer un nouveau projet
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Remplissez les informations du projet et assignez un chef de projet
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Nom du projet */}
        <div>
          <Label>
            Nom du projet <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            name="name"
            placeholder="Ex: Refonte du site web"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        {/* Description */}
        <div>
          <Label>Description</Label>
          <textarea
            name="description"
            rows={4}
            placeholder="Décrivez les objectifs et le contexte du projet..."
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>

        {/* Chef de projet */}
        <div>
          <Label>
            Chef de projet <span className="text-red-500">*</span>
          </Label>
          <select
            name="projectManagerId"
            value={formData.projectManagerId}
            onChange={handleChange}
            className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="">Sélectionner un chef de projet</option>
            {projectManagers.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name} ({pm.email}) - {pm.role}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Seuls les utilisateurs avec le rôle PROJECT_MANAGER ou ADMIN peuvent
            être assignés
          </p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Date de début</Label>
            <Input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Date de fin</Label>
            <Input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Statut */}
        <div>
          <Label>Statut initial</Label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="PLANNING">Planification</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="ON_HOLD">En pause</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Création..." : "Créer le projet"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/projects")}
            className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
