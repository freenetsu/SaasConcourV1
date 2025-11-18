import { useEffect, useState } from "react";
import { getAllProjects, getProjectById } from "../api/mock-projects";
import type { Project } from "../api/projects";
import { useAuth } from "../context/AuthContext";

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
        const data = await getAllProjects(user.id, user.role);
        setProjects(data);
        setError(null);
      } catch (err) {
        setError("Erreur lors du chargement des projets");
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
        const data = await getProjectById(projectId, user.id, user.role);
        setProject(data);
        setError(null);
      } catch (err) {
        setError("Erreur lors du chargement du projet");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [user, projectId]);

  return { project, loading, error };
}
