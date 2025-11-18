import { useState } from "react";
import { Link } from "react-router";
import type { Project } from "../../api/projects";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { useProjects } from "../../hooks/useProjects";

// Composant pour le badge de statut
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

// Composant pour une carte de projet
const ProjectCard = ({ project }: { project: Project }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow dark:bg-gray-900 dark:border-gray-800"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {project.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {project.description || "Aucune description"}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-gray-400"
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
          <span className="text-gray-600 dark:text-gray-400">
            {project._count?.tasks || 0} tâches
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-gray-400"
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
          <span className="text-gray-600 dark:text-gray-400">
            {formatDate(project.startDate)}
          </span>
        </div>
      </div>

      {/* Chef de projet */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/20">
          <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
            {project.projectManager?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {project.projectManager?.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Chef de projet
          </p>
        </div>
      </div>
    </Link>
  );
};

export default function ProjectsList() {
  const { projects, loading, error } = useProjects();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Filtrer les projets
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-4 border-gray-200 rounded-full animate-spin border-t-brand-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Chargement des projets...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Projets" description="Gestion des projets et tâches" />

      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Projets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === "ADMIN" ? "Tous les projets" : "Vos projets"}
          </p>
        </div>

        {/* Filtres */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Filtre par statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 min-w-[180px] border border-gray-200 rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PLANNING">Planification</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="ON_HOLD">En pause</option>
            <option value="COMPLETED">Terminé</option>
            <option value="CANCELLED">Annulé</option>
          </select>

          {/* Bouton Nouveau projet (ADMIN uniquement) */}
          {user?.role === "ADMIN" && (
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg bg-brand-500 hover:bg-brand-600"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nouveau projet
            </Link>
          )}
        </div>

        {/* Liste des projets */}
        {filteredProjects.length === 0 ? (
          <div className="py-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Aucun projet trouvé
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {searchTerm || statusFilter !== "ALL"
                ? "Essayez de modifier vos filtres"
                : "Commencez par créer un nouveau projet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          {filteredProjects.length} projet
          {filteredProjects.length > 1 ? "s" : ""} affiché
          {filteredProjects.length > 1 ? "s" : ""}
          {searchTerm || statusFilter !== "ALL"
            ? ` sur ${projects.length} au total`
            : ""}
        </div>
      </div>
    </>
  );
}
