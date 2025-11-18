import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { createProject } from "../../api/mock-projects";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";

export default function CreateProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "PLANNING" as const,
    startDate: "",
    endDate: "",
    projectManagerId: user?.id || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Créer le projet via l'API mockée
      await createProject(formData);

      // Rediriger vers la liste des projets
      navigate("/projects");
    } catch {
      setError("Erreur lors de la création du projet");
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

  // Seul l'ADMIN peut créer des projets
  if (user?.role !== "ADMIN") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Accès refusé
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Seuls les administrateurs peuvent créer des projets.
          </p>
          <Link
            to="/projects"
            className="text-brand-500 hover:text-brand-600"
          >
            Retour aux projets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Nouveau projet" description="Créer un nouveau projet" />

      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/projects"
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
            Retour aux projets
          </Link>

          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Créer un nouveau projet
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Remplissez les informations du projet
          </p>
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
                    placeholder="Ex: Refonte Site Web"
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
                    placeholder="Description du projet..."
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

                {/* Chef de projet */}
                <div>
                  <label
                    htmlFor="projectManagerId"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Chef de projet <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="projectManagerId"
                    name="projectManagerId"
                    value={formData.projectManagerId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Sélectionner un chef de projet</option>
                    <option value="2">Marie Dupont</option>
                    <option value="3">Sophie Bernard</option>
                    <option value="4">Thomas Leroy</option>
                    <option value="5">Lucas Petit</option>
                    <option value="6">Emma Dubois</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Le chef de projet sera responsable de la gestion de ce
                    projet
                  </p>
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
                {isLoading ? "Création..." : "Créer le projet"}
              </button>
              <Link
                to="/projects"
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
