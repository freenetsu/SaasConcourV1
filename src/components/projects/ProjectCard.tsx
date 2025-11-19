import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { canDeleteProject, canEditProject } from "../../lib/permissions";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  projectManager: {
    id: string;
    name: string;
    email: string;
  };
  tasks?: Array<{
    id: string;
    status: string;
  }>;
}

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  PLANNING: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ON_HOLD:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusLabels: Record<string, string> = {
  PLANNING: "Planification",
  IN_PROGRESS: "En cours",
  ON_HOLD: "En pause",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const { user } = useAuth();

  const canEdit = user
    ? canEditProject(user, project.projectManager.id)
    : false;
  const canDelete = user ? canDeleteProject(user) : false;

  const taskStats = project.tasks
    ? {
        total: project.tasks.length,
        done: project.tasks.filter((t) => t.status === "DONE").length,
      }
    : null;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Non définie";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Link
            to={`/projects/${project.id}`}
            className="text-lg font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400"
          >
            {project.name}
          </Link>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Chef de projet : {project.projectManager.name}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            statusColors[project.status] || statusColors.PLANNING
          }`}
        >
          {statusLabels[project.status] || project.status}
        </span>
      </div>

      {project.description && (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="flex gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-medium">Début :</span>{" "}
          {formatDate(project.startDate)}
        </div>
        <div>
          <span className="font-medium">Fin :</span>{" "}
          {formatDate(project.endDate)}
        </div>
      </div>

      {taskStats && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Progression
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {taskStats.done}/{taskStats.total} tâches
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all"
              style={{
                width:
                  taskStats.total > 0
                    ? `${(taskStats.done / taskStats.total) * 100}%`
                    : "0%",
              }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          to={`/projects/${project.id}`}
          className="flex-1 px-4 py-2 text-sm font-medium text-center text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
        >
          Voir détails
        </Link>
        {canEdit && (
          <Link
            to={`/projects/${project.id}/edit`}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Modifier
          </Link>
        )}
        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(project.id)}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
