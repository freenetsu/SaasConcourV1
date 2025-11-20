import { useCallback, useEffect, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import { API_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Appointment {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  client?: Client;
  project?: Project;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  SCHEDULED: {
    label: "Planifié",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  },
  CONFIRMED: {
    label: "Confirmé",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  },
  CANCELLED: {
    label: "Annulé",
    color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  },
  COMPLETED: {
    label: "Terminé",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
};

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    location: "",
    clientId: "",
    projectId: "",
    status: "SCHEDULED" as const,
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [appointmentsRes, clientsRes, projectsRes] = await Promise.all([
        fetch(`${API_URL}/appointments`, {
          headers: { "x-user-id": user.id },
        }),
        fetch(`${API_URL}/clients`, {
          headers: { "x-user-id": user.id },
        }),
        fetch(`${API_URL}/projects`, {
          headers: { "x-user-id": user.id },
        }),
      ]);

      const appointmentsData = await appointmentsRes.json();
      const clientsData = await clientsRes.json();
      const projectsData = await projectsRes.json();

      setAppointments(appointmentsData.appointments || []);
      setClients(clientsData.clients || []);
      setProjects(projectsData.projects || []);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validation des champs requis
    if (!formData.title || !formData.startDateTime || !formData.endDateTime) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const startDateTime = new Date(formData.startDateTime);
      const endDateTime = new Date(formData.endDateTime);

      // Vérifier que la date de fin est après la date de début
      if (endDateTime <= startDateTime) {
        alert("La date de fin doit être après la date de début");
        return;
      }

      const response = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          location: formData.location.trim() || null,
          clientId: formData.clientId.trim() || null,
          projectId: formData.projectId.trim() || null,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création");
      }

      // Reset form and reload
      setFormData({
        title: "",
        description: "",
        startDateTime: "",
        endDateTime: "",
        location: "",
        clientId: "",
        projectId: "",
        status: "SCHEDULED",
      });
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Erreur:", error);
      alert(
        error instanceof Error ? error.message : "Erreur lors de la création"
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !user ||
      !confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")
    )
      return;

    try {
      const response = await fetch(`${API_URL}/appointments/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": user.id },
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      loadData();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/appointments/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Erreur lors de la modification");

      loadData();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la modification du statut");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filterStatus !== "all" && apt.status !== filterStatus) return false;
    if (filterProject !== "all" && apt.project?.id !== filterProject)
      return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Rendez-vous | SaasConcour"
        description="Gérez vos rendez-vous clients"
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rendez-vous
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez vos rendez-vous avec vos clients
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
        >
          + Nouveau rendez-vous
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Statut
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-white rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">Tous</option>
            <option value="SCHEDULED">Planifié</option>
            <option value="CONFIRMED">Confirmé</option>
            <option value="CANCELLED">Annulé</option>
            <option value="COMPLETED">Terminé</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Projet
          </label>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 text-sm bg-white rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">Tous les projets</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des rendez-vous */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Aucun rendez-vous trouvé
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex gap-3 items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {appointment.title}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          statusConfig[appointment.status].color
                        }`}
                      >
                        {statusConfig[appointment.status].label}
                      </span>
                    </div>

                    {appointment.description && (
                      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                        {appointment.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex gap-1 items-center">
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
                        <span>
                          {formatDate(appointment.startDate)} à{" "}
                          {formatTime(appointment.startDate)}
                        </span>
                      </div>

                      {appointment.client && (
                        <div className="flex gap-1 items-center">
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
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span>{appointment.client.name}</span>
                          {appointment.client.company && (
                            <span className="text-gray-400">
                              ({appointment.client.company})
                            </span>
                          )}
                        </div>
                      )}

                      {appointment.project && (
                        <div className="flex gap-1 items-center">
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
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                          <span>{appointment.project.name}</span>
                        </div>
                      )}

                      {appointment.location && (
                        <div className="flex gap-1 items-center">
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
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span>{appointment.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 items-center ml-4">
                    <select
                      value={appointment.status}
                      onChange={(e) =>
                        handleStatusChange(appointment.id, e.target.value)
                      }
                      className="px-2 py-1 text-sm bg-white rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="SCHEDULED">Planifié</option>
                      <option value="CONFIRMED">Confirmé</option>
                      <option value="CANCELLED">Annulé</option>
                      <option value="COMPLETED">Terminé</option>
                    </select>
                    <button
                      onClick={() => handleDelete(appointment.id)}
                      className="p-2 text-red-600 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Supprimer"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="flex fixed inset-0 z-[9999] justify-center items-center p-4 bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-900 shadow-xl max-h-[90vh] overflow-y-auto relative">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Nouveau rendez-vous
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="px-3 py-2 w-full bg-white rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Ex: Réunion kick-off"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="px-3 py-2 w-full bg-white rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Détails du rendez-vous..."
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date et heure de début *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDateTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startDateTime: e.target.value })
                  }
                  className="px-3 py-2 w-full bg-white rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date et heure de fin *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDateTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endDateTime: e.target.value })
                  }
                  className="px-3 py-2 w-full bg-white rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lieu
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="px-3 py-2 w-full bg-white rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Ex: Salle de réunion A"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Client
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) =>
                    setFormData({ ...formData, clientId: e.target.value })
                  }
                  className="px-3 py-2 w-full bg-white rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Aucun client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                      {client.company && ` - ${client.company}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Projet
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) =>
                    setFormData({ ...formData, projectId: e.target.value })
                  }
                  className="px-3 py-2 w-full bg-white rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Aucun projet</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as typeof formData.status,
                    })
                  }
                  className="px-3 py-2 w-full bg-white rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="SCHEDULED">Planifié</option>
                  <option value="CONFIRMED">Confirmé</option>
                  <option value="CANCELLED">Annulé</option>
                  <option value="COMPLETED">Terminé</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Créer le rendez-vous
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
