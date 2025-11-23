import { useEffect, useState } from "react";
import { API_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";
import type { Project } from "../types/project";

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
        console.log(
          "🔍 [useProjects] Fetching projects from:",
          `${API_URL}/projects`
        );
        console.log("🔍 [useProjects] User ID:", user.id);

        const response = await fetch(`${API_URL}/projects`, {
          headers: {
            "x-user-id": user.id,
          },
        });

        console.log("📦 [useProjects] Response status:", response.status);

        const data = await response.json();
        console.log("📦 [useProjects] Response data:", data);

        if (!response.ok) {
          throw new Error(
            data.error || "Erreur lors du chargement des projets"
          );
        }

        setProjects(data.projects || []);
        setError(null);
      } catch (err) {
        const error = err as Error;
        console.error("❌ [useProjects] Error:", err);
        setError(error.message || "Failed to fetch");
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

        const url = `${API_URL}/projects/${projectId}`;
        console.log("🔍 Fetching project:", {
          url,
          projectId,
          userId: user.id,
          API_URL,
        });

        const response = await fetch(url, {
          headers: {
            "x-user-id": user.id,
          },
        });

        console.log("📦 Response status:", response.status);
        console.log(
          "📦 Response headers:",
          Object.fromEntries(response.headers.entries())
        );

        // Lire le texte brut d'abord pour voir ce qui est retourné
        const textResponse = await response.text();
        console.log(
          "📦 Raw response (first 200 chars):",
          textResponse.substring(0, 200)
        );

        let data;
        try {
          data = JSON.parse(textResponse);
          console.log("✅ Parsed JSON:", data);
        } catch (parseError) {
          console.error("❌ JSON Parse Error:", parseError);
          console.error("❌ Response was:", textResponse);
          throw new Error(
            `Invalid JSON response: ${textResponse.substring(0, 100)}`
          );
        }

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors du chargement du projet");
        }

        setProject(data.project);
        setError(null);
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Erreur lors du chargement du projet");
        console.error("❌ Full error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [user, projectId]);

  return { project, loading, error };
}
