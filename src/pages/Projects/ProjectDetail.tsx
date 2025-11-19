import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { deleteProject, getProjectStats } from "../../api/mock-projects";
import ChatBox from "../../components/chat/ChatBox";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../hooks/useProjects";

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

// Badge de priorité
const PriorityBadge = ({ priority }: { priority: string }) => {
  const priorityConfig = {
    LOW: {
      label: "Basse",
      color: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
    },
    MEDIUM: {
      label: "Moyenne",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    },
    HIGH: {
      label: "Haute",
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
    },
    URGENT: {
      label: "Urgente",
      color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    },
  };

  const config =
    priorityConfig[priority as keyof typeof priorityConfig] ||
    priorityConfig.MEDIUM;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

// Badge de statut de tâche
const TaskStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    TODO: {
      label: "À faire",
      color: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
    },
    IN_PROGRESS: {
      label: "En cours",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    },
    REVIEW: {
      label: "En revue",
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    },
    DONE: {
      label: "Terminé",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    },
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.TODO;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}
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
  const [stats, setStats] = useState<{
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    progress: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "members" | "chat">(
    "tasks"
  );

  useEffect(() => {
    if (project?.id) {
      getProjectStats(project.id).then(setStats);
    }
  }, [project]);

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

  // Récupérer tous les membres uniques du projet
  const projectMembers = new Map();

  // Ajouter le chef de projet
  if (project.projectManager) {
    projectMembers.set(project.projectManager.id, {
      ...project.projectManager,
      role: "Chef de projet",
      tasksCount: 0,
    });
  }

  // Ajouter les membres assignés aux tâches
  project.tasks?.forEach((task) => {
    if (task.assignee) {
      const existing = projectMembers.get(task.assignee.id);
      if (existing) {
        existing.tasksCount += 1;
      } else {
        projectMembers.set(task.assignee.id, {
          ...task.assignee,
          role: "Membre",
          tasksCount: 1,
        });
      }
    }
  });

  const members = Array.from(projectMembers.values());

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
      await deleteProject(id || "");
      navigate("/projects");
    } catch {
      alert("Erreur lors de la suppression du projet");
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 md:grid-cols-4">
          {/* Progression */}
          <div className="p-4 sm:p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Progression
              </span>
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-brand-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.progress || 0}%
            </div>
            <div className="mt-2 sm:mt-3 w-full h-2 bg-gray-200 rounded-full dark:bg-gray-800">
              <div
                className="h-2 rounded-full transition-all bg-brand-500"
                style={{ width: `${stats?.progress || 0}%` }}
              />
            </div>
          </div>

          {/* Total tâches */}
          <div className="p-4 sm:p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Total tâches
              </span>
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.total || 0}
            </div>
          </div>

          {/* En cours */}
          <div className="p-4 sm:p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                En cours
              </span>
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.inProgress || 0}
            </div>
          </div>

          {/* Terminées */}
          <div className="p-4 sm:p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Terminées
              </span>
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.done || 0}
            </div>
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
            <h3 className="mb-4 text-sm font-medium text-gray-500 uppercase dark:text-gray-400">
              Membres de l'équipe ({members.length})
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
                >
                  <div className="flex gap-3 items-center mb-2">
                    <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/20">
                      <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.role} • {member.tasksCount} tâche
                        {member.tasksCount > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              onClick={() => setActiveTab("members")}
              className={`pb-3 sm:pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "members"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Membres ({members.length})
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

        {/* Content */}
        {activeTab === "tasks" ? (
          <div className="space-y-3">
            {canEdit && (
              <button className="p-4 w-full text-sm font-medium rounded-lg border-2 border-dashed text-brand-600 border-brand-300 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-400 dark:hover:bg-brand-900/20">
                + Ajouter une tâche
              </button>
            )}

            {project.tasks && project.tasks.length > 0 ? (
              project.tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <TaskStatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 sm:gap-4 items-center mt-3 text-xs sm:text-sm">
                    {task.assignee && (
                      <div className="flex gap-2 items-center">
                        <div className="flex justify-center items-center w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/20">
                          <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                            {task.assignee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">
                          {task.assignee.name}
                        </span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatDate(task.dueDate)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Aucune tâche pour ce projet
                </p>
              </div>
            )}
          </div>
        ) : activeTab === "members" ? (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 sm:p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
              >
                <div className="flex gap-4 items-center mb-4">
                  <div className="flex flex-shrink-0 justify-center items-center w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/20">
                    <span className="text-lg font-medium text-brand-600 dark:text-brand-400">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate dark:text-white">
                      {member.name}
                    </h4>
                    <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {member.role}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {member.tasksCount} tâche
                      {member.tasksCount > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ChatBox projectId={id || ""} />
        )}
      </div>
    </>
  );
}
