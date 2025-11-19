import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Appointment } from "../../api/mock-appointments";
import { getUserAppointments } from "../../api/mock-appointments";
import { getAllProjects } from "../../api/mock-projects";
import PageMeta from "../../components/common/PageMeta";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import type { Project } from "../../types/project";

export default function Home() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiTest, setApiTest] = useState<string>("Testing API...");

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Test API call
        console.log("🔍 Testing API at:", API_URL);
        setApiTest(`Testing API at: ${API_URL}`);

        const testResponse = await fetch(`${API_URL}/projects`, {
          headers: {
            "x-user-id": user.id,
          },
        });

        console.log("📦 API Response status:", testResponse.status);
        const testData = await testResponse.json();
        console.log("📦 API Response data:", testData);
        setApiTest(
          `API Status: ${testResponse.status} - Projects: ${testData.projects?.length || 0}`
        );

        const [appointmentsData, projectsData] = await Promise.all([
          getUserAppointments(user.id),
          getAllProjects(user.id, user.role),
        ]);
        setAppointments(appointmentsData);
        setProjects(projectsData);
      } catch (error) {
        console.error("❌ Erreur lors du chargement des données:", error);
        setApiTest(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const now = new Date();
  const upcomingAppointments = appointments
    .filter(
      (apt) => new Date(apt.startDate) > now && apt.status !== "cancelled"
    )
    .slice(0, 5);

  const activeProjects = projects.filter((p) => p.status === "IN_PROGRESS");
  const completedProjects = projects.filter((p) => p.status === "COMPLETED");

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Tableau de bord | SaasConcour"
        description="Vue d'ensemble de vos projets et rendez-vous"
      />

      {/* Header avec bienvenue */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bonjour, {user?.name} ! 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Voici un aperçu de votre activité
        </p>
        {/* API Test Debug */}
        <div className="mt-2 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm font-mono text-yellow-800 dark:text-yellow-200">
            🔍 API Test: {apiTest}
          </p>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3 md:gap-6">
        {/* Total projets */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Projets
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {projects.length}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 dark:text-green-400">
              {activeProjects.length} en cours
            </span>
            <span className="mx-2 text-gray-300 dark:text-gray-700">•</span>
            <span className="text-gray-500 dark:text-gray-400">
              {completedProjects.length} terminés
            </span>
          </div>
        </div>

        {/* Rendez-vous à venir */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Rendez-vous à venir
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {upcomingAppointments.length}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
              <svg
                className="h-6 w-6 text-purple-600 dark:text-purple-400"
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
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {upcomingAppointments.length > 0
              ? `Prochain: ${formatDate(upcomingAppointments[0].startDate)}`
              : "Aucun rendez-vous prévu"}
          </div>
        </div>

        {/* Total rendez-vous */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Rendez-vous
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {appointments.length}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
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
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Ce mois-ci
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
        {/* Projets récents */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Projets en cours
            </h2>
            <Link
              to="/projects"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Voir tout →
            </Link>
          </div>
          <div className="p-6">
            {activeProjects.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Aucun projet en cours
              </p>
            ) : (
              <div className="space-y-4">
                {activeProjects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {project.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {project.description?.substring(0, 60)}
                          {project.description &&
                          project.description.length > 60
                            ? "..."
                            : ""}
                        </p>
                      </div>
                      <span className="ml-4 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        En cours
                      </span>
                    </div>
                    <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <svg
                        className="mr-1 h-4 w-4"
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
                      Début: {formatDate(project.startDate)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rendez-vous à venir */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Prochains rendez-vous
            </h2>
            <Link
              to="/appointments"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Voir tout →
            </Link>
          </div>
          <div className="p-6">
            {upcomingAppointments.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Aucun rendez-vous prévu
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {appointment.title}
                        </h3>
                        {appointment.description && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {appointment.description.substring(0, 60)}
                            {appointment.description.length > 60 ? "..." : ""}
                          </p>
                        )}
                      </div>
                      <span
                        className={`ml-4 rounded-full px-3 py-1 text-xs font-medium ${
                          appointment.status === "confirmed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        }`}
                      >
                        {appointment.status === "confirmed"
                          ? "Confirmé"
                          : "Planifié"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <svg
                        className="mr-2 h-4 w-4"
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
                      {formatDate(appointment.startDate)} à{" "}
                      {formatTime(appointment.startDate)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
