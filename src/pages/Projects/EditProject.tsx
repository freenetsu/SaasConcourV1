import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../hooks/useProjects";

const API_URL = "http://localhost:3001/api";

interface ProjectManager {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function EditProject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { project, loading } = useProject(id || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [projectManagers, setProjectManagers] = useState<ProjectManager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
    startDate: string;
    endDate: string;
    projectManagerId: string;
  }>({
    name: "",
    description: "",
    status: "PLANNING",
    startDate: "",
    endDate: "",
    projectManagerId: "",
  });

  // Charger les PROJECT_MANAGER (pour ADMIN uniquement)
  useEffect(() => {
    const fetchProjectManagers = async () => {
      try {
        setLoadingManagers(true);
        const response = await fetch(`${API_URL}/users/project-managers`, {
          headers: {
            "x-user-id": user?.id || "",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors du chargement");
        }

        setProjectManagers(data.users || []);
      } catch (err) {
        console.error("Error fetching project managers:", err);
      } finally {
        setLoadingManagers(false);
      }
    };

    if (user?.role === "ADMIN") {
      fetchProjectManagers();
    } else {
      setLoadingManagers(false);
    }
  }, [user]);

  // Charger les données du projet
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        status: project.status as
          | "PLANNING"
          | "IN_PROGRESS"
          | "ON_HOLD"
          | "COMPLETED"
          | "CANCELLED",
        startDate: project.startDate
          ? new Date(project.startDate).toISOString().split("T")[0]
          : "",
        endDate: project.endDate
          ? new Date(project.endDate).toISOString().split("T")[0]
          : "",
        projectManagerId: project.projectManagerId,
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Si PROJECT_MANAGER, ne pas envoyer projectManagerId
      const dataToSend =
        user?.role === "ADMIN"
          ? formData
          : {
              name: formData.name,
              description: formData.description,
              status: formData.status,
              startDate: formData.startDate,
              endDate: formData.endDate,
            };

      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erreur lors de la modification du projet"
        );
      }

      // Rediriger vers le détail du projet
      navigate(`/projects/${id}`);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Erreur lors de la modification du projet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Vérifier les permissions
  const isProjectManager = project?.projectManagerId === user?.id;
  const isAdmin = user?.role === "ADMIN";
  const canEdit = isAdmin || isProjectManager;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Accès refusé
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Vous n'avez pas les permissions pour modifier ce projet.
          </p>
          <Link
            to={`/projects/${id}`}
            className="text-brand-500 hover:text-brand-600"
          >
            Retour au projet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Modifier ${project?.name}`}
        description="Modifier le projet"
      />

      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/projects/${id}`}
            className="inline-flex gap-2 items-center mb-4 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Retour au projet
          </Link>

          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Modifier le projet
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{project?.name}</p>
        </div>

        {/* Formulaire */}
        <div className="max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Erreur */}
            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Carte du formulaire */}
            <div className="p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
              <div className="space-y-6">
                {/* Nom du projet */}
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Nom du projet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Statut */}
                <div>
                  <label
                    htmlFor="status"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Statut <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="PLANNING">Planification</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="ON_HOLD">En pause</option>
                    <option value="COMPLETED">Terminé</option>
                    <option value="CANCELLED">Annulé</option>
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Date de début */}
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Date de début <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Date de fin */}
                  <div>
                    <label
                      htmlFor="endDate"
                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Date de fin
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Chef de projet - Modifiable uniquement par ADMIN */}
                <div>
                  <label
                    htmlFor="projectManagerId"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Chef de projet <span className="text-red-500">*</span>
                  </label>
                  {isAdmin ? (
                    <select
                      id="projectManagerId"
                      name="projectManagerId"
                      value={formData.projectManagerId}
                      onChange={handleChange}
                      required
                      disabled={loadingManagers}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                    >
                      <option value="">
                        {loadingManagers
                          ? "Chargement..."
                          : "Sélectionner un chef de projet"}
                      </option>
                      {projectManagers.map((pm) => (
                        <option key={pm.id} value={pm.id}>
                          {pm.name} - {pm.role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 dark:border-gray-800 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {project?.projectManager?.name || "Non défini"}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                        Seul un administrateur peut modifier le chef de projet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 text-white rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Enregistrement..."
                  : "Enregistrer les modifications"}
              </button>
              <Link
                to={`/projects/${id}`}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
