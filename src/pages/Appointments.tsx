import { useEffect, useState } from "react";
import {
  Appointment,
  AppointmentStatus,
  appointmentStatusConfig,
  changeAppointmentStatus,
  createAppointment,
  deleteAppointment,
  getUserAppointments,
  updateAppointment,
} from "../api/mock-appointments";
import { getAllProjects } from "../api/mock-projects";
import type { Project } from "../api/projects";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import { Modal } from "../components/ui/modal";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../hooks/useModal";

export default function Appointments() {
  const { user } = useAuth();
  const { isOpen, openModal, closeModal } = useModal();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    projectId: string;
    status: AppointmentStatus;
  }>({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    projectId: "",
    status: "scheduled",
  });

  useEffect(() => {
    loadAppointments();
    loadProjects();
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserAppointments(user.id);
      // Trier par date (les plus proches en premier pour les futurs, les plus récents pour les passés)
      const sorted = data.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      setAppointments(sorted);
    } catch (error) {
      console.error("Erreur lors du chargement des rendez-vous:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!user) return;
    try {
      const data = await getAllProjects(user.id, user.role);
      setProjects(data);
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    }
  };

  const handleOpenModal = (appointment?: Appointment) => {
    if (appointment) {
      setSelectedAppointment(appointment);
      const startDate = new Date(appointment.startDate);
      const endDate = new Date(appointment.endDate);

      setFormData({
        title: appointment.title,
        description: appointment.description || "",
        startDate: startDate.toISOString().split("T")[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split("T")[0],
        endTime: endDate.toTimeString().slice(0, 5),
        projectId: appointment.projectId || "",
        status: appointment.status,
      });
    } else {
      setSelectedAppointment(null);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      setFormData({
        title: "",
        description: "",
        startDate: tomorrow.toISOString().split("T")[0],
        startTime: "10:00",
        endDate: tomorrow.toISOString().split("T")[0],
        endTime: "11:00",
        projectId: "",
        status: "scheduled",
      });
    }
    openModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validation
    if (
      !formData.title ||
      !formData.startDate ||
      !formData.startTime ||
      !formData.endDate ||
      !formData.endTime
    ) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      // Créer les objets Date
      const startDate = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDate = new Date(`${formData.endDate}T${formData.endTime}`);

      // Vérifier que la date de fin est après la date de début
      if (endDate <= startDate) {
        alert("La date de fin doit être après la date de début");
        return;
      }

      if (selectedAppointment) {
        // Modification
        await updateAppointment(selectedAppointment.id, {
          title: formData.title,
          description: formData.description,
          startDate,
          endDate,
          status: formData.status,
          projectId: formData.projectId || undefined,
          userId: user.id,
        });
      } else {
        // Création
        await createAppointment({
          title: formData.title,
          description: formData.description,
          startDate,
          endDate,
          status: formData.status,
          projectId: formData.projectId || undefined,
          userId: user.id,
        });
      }

      // Recharger les rendez-vous et fermer le modal
      await loadAppointments();
      closeModal();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde du rendez-vous");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")
    ) {
      return;
    }

    try {
      await deleteAppointment(id);
      await loadAppointments();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression du rendez-vous");
    }
  };

  const handleStatusChange = async (
    id: string,
    newStatus: AppointmentStatus
  ) => {
    try {
      await changeAppointmentStatus(id, newStatus);
      await loadAppointments();
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
      alert("Erreur lors du changement de statut");
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    const project = projects.find((p) => p.id === projectId);
    return project?.name;
  };

  const now = new Date();

  const upcomingAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.startDate);
    return aptDate > now && apt.status !== "cancelled";
  });

  const pastAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.startDate);
    return aptDate <= now || apt.status === "cancelled";
  });

  return (
    <>
      <PageMeta
        title="Rendez-vous | SaasConcour"
        description="Gérez vos rendez-vous clients"
      />
      <PageBreadcrumb pageTitle="Rendez-vous" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Mes rendez-vous
          </h3>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            <svg
              className="size-5"
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
            Nouveau rendez-vous
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            Chargement...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Rendez-vous à venir */}
            <div>
              <h4 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">
                À venir ({upcomingAppointments.length})
              </h4>
              {upcomingAppointments.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-900/50">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aucun rendez-vous à venir
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => {
                    const statusConfig =
                      appointmentStatusConfig[appointment.status];
                    const projectName = getProjectName(appointment.projectId);

                    return (
                      <div
                        key={appointment.id}
                        className="p-4 bg-white rounded-lg border border-gray-200 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex gap-3 items-center mb-2">
                              <h5 className="text-base font-semibold text-gray-800 dark:text-white/90">
                                {appointment.title}
                              </h5>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.darkBgColor} ${statusConfig.darkTextColor}`}
                              >
                                {statusConfig.label}
                              </span>
                            </div>

                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              <p className="flex gap-2 items-center">
                                <svg
                                  className="size-4"
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
                                {formatDate(appointment.startDate)}
                              </p>
                              <p className="flex gap-2 items-center">
                                <svg
                                  className="size-4"
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
                                {formatTime(appointment.startDate)} -{" "}
                                {formatTime(appointment.endDate)}
                              </p>
                              {projectName && (
                                <p className="flex gap-2 items-center">
                                  <svg
                                    className="size-4"
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
                                  {projectName}
                                </p>
                              )}
                              {appointment.description && (
                                <p className="mt-2 text-gray-500 dark:text-gray-400">
                                  {appointment.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 items-center ml-4">
                            {appointment.status === "scheduled" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    appointment.id,
                                    "confirmed"
                                  )
                                }
                                className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                                title="Confirmer"
                              >
                                Confirmer
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenModal(appointment)}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                              title="Modifier"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(appointment.id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                              title="Supprimer"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rendez-vous passés */}
            {pastAppointments.length > 0 && (
              <div>
                <h4 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">
                  Passés ({pastAppointments.length})
                </h4>
                <div className="space-y-3">
                  {pastAppointments.slice(0, 5).map((appointment) => {
                    const statusConfig =
                      appointmentStatusConfig[appointment.status];
                    const projectName = getProjectName(appointment.projectId);

                    return (
                      <div
                        key={appointment.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-75 dark:border-gray-800 dark:bg-gray-900/30"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex gap-3 items-center mb-2">
                              <h5 className="text-base font-medium text-gray-700 dark:text-gray-300">
                                {appointment.title}
                              </h5>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.darkBgColor} ${statusConfig.darkTextColor}`}
                              >
                                {statusConfig.label}
                              </span>
                            </div>

                            <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                              <p>
                                {formatDate(appointment.startDate)} •{" "}
                                {formatTime(appointment.startDate)} -{" "}
                                {formatTime(appointment.endDate)}
                              </p>
                              {projectName && <p>Projet: {projectName}</p>}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDelete(appointment.id)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                            title="Supprimer"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      <Modal isOpen={isOpen} onClose={closeModal}>
        <div className="p-6">
          <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            {selectedAppointment
              ? "Modifier le rendez-vous"
              : "Nouveau rendez-vous"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Titre */}
            <div>
              <Label>
                Titre <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Ex: Réunion client"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <textarea
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder-gray-500 dark:focus:border-brand-400"
                rows={3}
                placeholder="Détails du rendez-vous..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Date et heure de début */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Date de début <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>
                  Heure de début <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Date et heure de fin */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Date de fin <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>
                  Heure de fin <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Projet associé */}
            <div>
              <Label>Projet associé (optionnel)</Label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-400"
                value={formData.projectId}
                onChange={(e) =>
                  setFormData({ ...formData, projectId: e.target.value })
                }
              >
                <option value="">Aucun projet</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Statut */}
            <div>
              <Label>Statut</Label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-400"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as AppointmentStatus,
                  })
                }
              >
                <option value="scheduled">Planifié</option>
                <option value="confirmed">Confirmé</option>
                <option value="cancelled">Annulé</option>
                <option value="completed">Terminé</option>
              </select>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 justify-end items-center pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700"
              >
                {selectedAppointment ? "Modifier" : "Créer"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
