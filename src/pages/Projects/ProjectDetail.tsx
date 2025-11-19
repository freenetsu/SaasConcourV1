import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ChatBox from "../../components/chat/ChatBox";
import PageMeta from "../../components/common/PageMeta";
import ProjectMembers from "../../components/projects/ProjectMembers";
import TasksList from "../../components/tasks/TasksList";
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../hooks/useProjects";

const API_URL = "http://localhost:3001/api";

// Badge de statut
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    PLANNING: {
      label: "Planification",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    },
    IN_PROGRESS: {
      label: "En cours",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    },
    ON_HOLD: {
      label: "En pause",
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    },
    COMPLETED: {
      label: "Terminé",
      color: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
    },
    CANCELLED: {
      label: "Annulé",
      color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.PLANNING;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, loading, error } = useProject(id || "");
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"tasks" | "chat">("tasks");

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-t-4 border-gray-200 animate-spin border-t-brand-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Chargement du projet...
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            {error || "Projet non trouvé"}
          </p>
          <button
            onClick={() => navigate("/projects")}
            className="mt-4 text-brand-500 hover:text-brand-600"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isProjectManager = project.projectManagerId === user?.id;
  const isAdmin = user?.role === "ADMIN";
  const canEdit = isAdmin || isProjectManager;

  // Gérer la modification
  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };

  // Gérer la suppression
  const handleDelete = async () => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user?.id || "",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      navigate("/projects");
    } catch (err) {
      const error = err as Error;
      alert(error.message || "Erreur lors de la suppression du projet");
    }
  };

  return (
    <>
      <PageMeta
        title={project.name}
        description={`Détails du projet ${project.name}`}
      />

      <div className="p-4 sm:p-6">
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

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {project.description || "Aucune description"}
              </p>
            </div>

            {canEdit && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleEdit}
                  className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Modifier
                </button>
                {isAdmin && (
                  <button
                    onClick={handleDelete}
                    className="px-3 sm:px-4 py-2 text-sm font-medium text-red-600 bg-white rounded-lg border border-red-200 hover:bg-red-50 dark:bg-gray-900 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Infos projet */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 lg:grid-cols-3">
          <div className="p-4 sm:p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
            <h3 className="mb-4 text-sm font-medium text-gray-500 uppercase dark:text-gray-400">
              Informations
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Date de début
                </span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(project.startDate)}
                </p>
              </div>
              {project.endDate && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Date de fin
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(project.endDate)}
                  </p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Chef de projet
                </span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {project.projectManager?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Membres du projet */}
          <div className="p-4 sm:p-6 bg-white rounded-xl border border-gray-200 lg:col-span-2 dark:bg-gray-900 dark:border-gray-800">
            <ProjectMembers
              projectId={project.id}
              projectManagerId={project.projectManagerId}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <nav className="flex gap-4 sm:gap-8 min-w-max">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`pb-3 sm:pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "tasks"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Tâches ({project.tasks?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`pb-3 sm:pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "chat"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Discussion
            </button>
          </nav>
        </div>

        {/* Contenu des tabs */}
        {activeTab === "tasks" ? (
          <div>
            <TasksList
              projectId={project.id}
              projectManagerId={project.projectManagerId}
            />
          </div>
        ) : (
          <ChatBox projectId={id || ""} />
        )}
      </div>
    </>
  );
}
