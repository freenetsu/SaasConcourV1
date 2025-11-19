import { useEffect, useState } from "react";
import type { Project } from "../api/projects";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:3001/api";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/projects`, {
          headers: {
            "x-user-id": user.id,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Erreur lors du chargement des projets"
          );
        }

        setProjects(data.projects || []);
        setError(null);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Erreur lors du chargement des projets");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  return { projects, loading, error };
}

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !projectId) return;

    const fetchProject = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/projects/${projectId}`, {
          headers: {
            "x-user-id": user.id,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors du chargement du projet");
        }

        setProject(data.project);
        setError(null);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Erreur lors du chargement du projet");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [user, projectId]);

  return { project, loading, error };
}
