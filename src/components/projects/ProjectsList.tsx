import { useEffect, useState } from "react";
import { Link } from "react-router";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { canCreateProject } from "../../lib/permissions";
import ProjectCard from "./ProjectCard";

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

export default function ProjectsList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("ALL");

  const canCreate = user ? canCreateProject(user) : false;

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/projects`, {
        headers: {
          "x-user-id": user?.id || "",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement des projets");
      }

      setProjects(data.projects || []);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
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

      // Recharger la liste
      fetchProjects();
    } catch (err) {
      const error = err as Error;
      alert(error.message);
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (filter === "ALL") return true;
    return project.status === filter;
  });

  const getRoleLabel = () => {
    switch (user?.role) {
      case "ADMIN":
        return "Tous les projets";
      case "PROJECT_MANAGER":
        return "Mes projets";
      case "USER":
        return "Projets où j'ai des tâches";
      default:
        return "Projets";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          Chargement des projets...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getRoleLabel()}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filteredProjects.length} projet
            {filteredProjects.length > 1 ? "s" : ""}
          </p>
        </div>
        {canCreate && (
          <Link
            to="/projects/new"
            className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
          >
            + Nouveau projet
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: "ALL", label: "Tous" },
          { value: "PLANNING", label: "Planification" },
          { value: "IN_PROGRESS", label: "En cours" },
          { value: "ON_HOLD", label: "En pause" },
          { value: "COMPLETED", label: "Terminés" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === f.value
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {filter === "ALL"
              ? "Aucun projet pour le moment"
              : `Aucun projet ${filter.toLowerCase()}`}
          </p>
          {canCreate && filter === "ALL" && (
            <Link
              to="/projects/new"
              className="inline-block mt-4 text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Créer votre premier projet →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={canCreate ? handleDelete : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
