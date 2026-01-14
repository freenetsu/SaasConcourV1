import { DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useEffect, useRef, useState } from "react";
import { eventTypeConfig, type EventType } from "../api/mock-calendar";
import PageMeta from "../components/common/PageMeta";
import { Modal } from "../components/ui/modal";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../hooks/useModal";
import GoogleCalendarConnect from "../components/GoogleCalendarConnect";
import ConflictResolutionModal from "../components/ConflictResolutionModal";
import { useGoogleCalendar } from "../context/GoogleCalendarContext";
import { API_URL } from "../config/api";

interface CalendarEvent extends EventInput {
  id: string;
  extendedProps: {
    type: EventType;
    description?: string;
    projectId?: string;
    taskId?: string;
  };
}

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const { isSyncing, isConnected, syncNow } = useGoogleCalendar();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventType, setEventType] = useState<EventType>("meeting");
  const [allDay, setAllDay] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [conflicts, setConflicts] = useState<Array<{ eventId: string; title: string; localUpdated: string; googleUpdated: string }>>([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const [hasAutoSynced, setHasAutoSynced] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset auto-sync flag when user or connection changes
  useEffect(() => {
    setHasAutoSynced(false);
  }, [user?.id, isConnected]);

  // Auto-sync Google Calendar only once when connected
  useEffect(() => {
    if (!user?.id || !isConnected || isSyncing || hasAutoSynced) return;

    const autoSync = async () => {
      try {
        await syncNow();
        setHasAutoSynced(true);
      } catch (error) {
        console.error("Auto-sync failed:", error);
      }
    };

    autoSync();
  }, [user?.id, isConnected, isSyncing, hasAutoSynced, syncNow]);

  const loadEvents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/events?userId=${user.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const userEvents = await response.json();

      console.log("=== FRONTEND DEBUG ===");
      console.log("Browser timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
      console.log("Browser timezone offset (minutes):", new Date().getTimezoneOffset());
      userEvents.slice(0, 3).forEach((event: { title: string; startDate: string; endDate: string }) => {
        console.log(`Event: ${event.title}`);
        console.log(`  API startDate (raw): ${event.startDate}`);
        console.log(`  Parsed as Date: ${new Date(event.startDate)}`);
        console.log(`  Date.toLocaleString(): ${new Date(event.startDate).toLocaleString()}`);
      });
      console.log("=== END FRONTEND DEBUG ===");

      const formattedEvents: CalendarEvent[] = userEvents.map((event: {
        id: string;
        title: string;
        startDate: string;
        endDate: string;
        type: string;
        description?: string;
        syncStatus: string;
        googleEventId?: string;
      }) => {
        const typeKey = event.type?.toLowerCase() as EventType;
        const config = eventTypeConfig[typeKey] || eventTypeConfig[event.type as EventType];
        const eventColor = config?.color || "#6B7280";

        return {
          id: event.id,
          title: event.title,
          start: event.startDate,
          end: event.endDate,
          allDay: false,
          backgroundColor: eventColor,
          borderColor: eventColor,
          extendedProps: {
            type: typeKey || event.type,
            description: event.description,
            syncStatus: event.syncStatus,
            googleEventId: event.googleEventId,
          },
        };
      });
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user, isSyncing]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    const startDate = new Date(selectInfo.start);
    const endDate = new Date(selectInfo.end || selectInfo.start);

    setEventStartDate(startDate.toISOString().split("T")[0]);
    setEventStartTime(startDate.toTimeString().slice(0, 5));
    setEventEndDate(endDate.toISOString().split("T")[0]);
    setEventEndTime(endDate.toTimeString().slice(0, 5));
    setAllDay(selectInfo.allDay);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventDescription(event.extendedProps.description || "");
    setEventType(event.extendedProps.type);

    const startDate = event.start || new Date();
    const endDate = event.end || startDate;

    setEventStartDate(startDate.toISOString().split("T")[0]);
    setEventStartTime(startDate.toTimeString().slice(0, 5));
    setEventEndDate(endDate.toISOString().split("T")[0]);
    setEventEndTime(endDate.toTimeString().slice(0, 5));
    setAllDay(event.allDay || false);
    openModal();
  };

  const formatDateTimeForAPI = (dateStr: string, timeStr: string = "00:00") => {
    const date = new Date(`${dateStr}T${timeStr}:00`);
    const tzOffset = -date.getTimezoneOffset();
    const sign = tzOffset >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
    const minutes = String(Math.abs(tzOffset) % 60).padStart(2, '0');
    return `${dateStr}T${timeStr}:00${sign}${hours}:${minutes}`;
  };

  const handleAddOrUpdateEvent = async () => {
    if (!user || !eventTitle.trim()) return;

    const startDateTime = allDay
      ? formatDateTimeForAPI(eventStartDate, "00:00")
      : formatDateTimeForAPI(eventStartDate, eventStartTime);
    const endDateTime = allDay
      ? formatDateTimeForAPI(eventEndDate, "23:59")
      : formatDateTimeForAPI(eventEndDate, eventEndTime);

    try {
      if (selectedEvent) {
        const response = await fetch(`${API_URL}/events/${selectedEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: eventTitle,
            description: eventDescription,
            type: eventType,
            startDate: startDateTime,
            endDate: endDateTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update event");
        }

        await loadEvents();
      } else {
        const response = await fetch(`${API_URL}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: eventTitle,
            description: eventDescription,
            type: eventType,
            startDate: startDateTime,
            endDate: endDateTime,
            userId: user.id,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create event");
        }

        await loadEvents();
      }
      closeModal();
      resetModalFields();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde de l'événement");
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/events/${selectedEvent.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      await loadEvents();
      closeModal();
      resetModalFields();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression de l'événement");
    }
  };

  const handleResolveConflict = async (eventId: string, resolution: "local" | "google") => {
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });

      if (!response.ok) {
        throw new Error("Failed to resolve conflict");
      }

      await loadEvents();
      setConflicts(prev => prev.filter(c => c.eventId !== eventId));
    } catch (error) {
      console.error("Failed to resolve conflict:", error);
      throw error;
    }
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventDescription("");
    setEventStartDate("");
    setEventStartTime("09:00");
    setEventEndDate("");
    setEventEndTime("10:00");
    setEventType("meeting");
    setAllDay(false);
    setSelectedEvent(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">
          Chargement du calendrier...
        </p>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Mon Calendrier | TailAdmin"
        description="Gérez votre emploi du temps et vos événements de travail"
      />
      <GoogleCalendarConnect />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
            headerToolbar={{
              left: "prev,next",
              center: "title",
              right: isMobile
                ? "today"
                : "addEventButton,timeGridDay,timeGridWeek,dayGridMonth",
            }}
            footerToolbar={
              isMobile
                ? {
                    center: "addEventButton",
                  }
                : undefined
            }
            slotMinTime="06:00:00"
            slotMaxTime="23:00:00"
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            allDaySlot={true}
            weekends={true}
            nowIndicator={true}
            timeZone="local"
            locale="fr"
            height={isMobile ? "auto" : "auto"}
            contentHeight={isMobile ? 600 : "auto"}
            aspectRatio={isMobile ? 1 : 1.8}
            eventMinHeight={isMobile ? 25 : 30}
            eventShortHeight={isMobile ? 25 : 30}
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            dayHeaderFormat={
              isMobile
                ? {
                    weekday: "short",
                    day: "numeric",
                  }
                : {
                    weekday: "short",
                    day: "numeric",
                    month: "numeric",
                  }
            }
            buttonText={{
              today: isMobile ? "Auj." : "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
            }}
            views={{
              timeGridWeek: {
                dayHeaderFormat: isMobile
                  ? {
                      weekday: "narrow",
                      day: "numeric",
                    }
                  : {
                      weekday: "short",
                      day: "numeric",
                    },
              },
              timeGridDay: {
                titleFormat: { year: "numeric", month: "long", day: "numeric" },
              },
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "+ Nouvel événement",
                click: () => {
                  resetModalFields();
                  const now = new Date();
                  setEventStartDate(now.toISOString().split("T")[0]);
                  setEventStartTime("09:00");
                  setEventEndDate(now.toISOString().split("T")[0]);
                  setEventEndTime("10:00");
                  openModal();
                },
              },
            }}
          />
        </div>
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="w-full max-w-[700px] mx-4 sm:mx-auto p-4 sm:p-6 lg:p-8 max-h-[90vh]"
        >
          <div className="flex overflow-y-auto flex-col px-1 sm:px-2 custom-scrollbar max-h-[calc(90vh-2rem)]">
            <div>
              <h5 className="mb-2 text-lg font-medium text-gray-900 modal-title sm:text-xl dark:text-white lg:text-2xl">
                {selectedEvent ? "Modifier l'événement" : "Nouvel événement"}
              </h5>
              <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                Organisez votre emploi du temps et planifiez vos activités
              </p>
            </div>
            <div className="mt-6 sm:mt-8">
              {/* Titre */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Ex: Réunion d'équipe"
                  required
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              {/* Description */}
              <div className="mt-4 sm:mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Description
                </label>
                <textarea
                  id="event-description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Détails de l'événement..."
                  rows={2}
                  className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 resize-none"
                />
              </div>
              {/* Type d'événement */}
              <div className="mt-4 sm:mt-6">
                <label className="block mb-3 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Type d'événement <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(eventTypeConfig)
                    .filter(([key]) => !key.match(/^[A-Z]/))
                    .map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEventType(key as EventType)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all duration-200 ${
                        eventType === key
                          ? "border-transparent shadow-md"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      }`}
                      style={eventType === key ? {
                        backgroundColor: config.bgColor,
                        borderColor: config.color
                      } : undefined}
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className={`text-xs font-medium sm:text-sm ${
                        eventType === key ? "text-gray-900" : "text-gray-700 dark:text-gray-300"
                      }`}>
                        {config.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toute la journée */}
              <div className="mt-4 sm:mt-6">
                <label className="flex gap-3 items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={allDay}
                      onChange={(e) => setAllDay(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 transition-colors duration-200 dark:bg-gray-700"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                    Toute la journée
                  </span>
                </label>
              </div>

              {/* Dates et heures */}
              <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Début <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="event-start-date"
                      type="date"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                      required
                      className="dark:bg-dark-900 h-10 flex-1 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-blue-500"
                    />
                    {!allDay && (
                      <input
                        id="event-start-time"
                        type="time"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        required
                        className="dark:bg-dark-900 h-10 w-24 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-2 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-blue-500"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Fin <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="event-end-date"
                      type="date"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      required
                      className="dark:bg-dark-900 h-10 flex-1 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-blue-500"
                    />
                    {!allDay && (
                      <input
                        id="event-end-time"
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        required
                        className="dark:bg-dark-900 h-10 w-24 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-2 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-blue-500"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 items-stretch mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 sm:flex-row sm:gap-3 sm:items-center modal-footer sm:justify-between">
              {selectedEvent ? (
                <button
                  onClick={handleDeleteEvent}
                  type="button"
                  className="flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer
                </button>
              ) : <div />}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={closeModal}
                  type="button"
                  className="flex w-full sm:w-auto justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddOrUpdateEvent}
                  type="button"
                  className="flex w-full sm:w-auto justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"
                >
                  {selectedEvent ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
      <ConflictResolutionModal
        isOpen={showConflicts}
        onClose={() => setShowConflicts(false)}
        conflicts={conflicts}
        onResolve={handleResolveConflict}
      />
    </>
  );
};

const renderEventContent = (eventInfo: {
  event: { extendedProps: { type: EventType }; title: string };
  timeText: string;
  view: { type: string };
}) => {
  const isMonthView = eventInfo.view.type === "dayGridMonth";

  return (
    <div className="flex items-center gap-1.5 px-1.5 py-1 overflow-hidden text-white w-full">
      {isMonthView && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: "currentColor" }}
        />
      )}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        {eventInfo.timeText && !isMonthView && (
          <span className="text-[11px] sm:text-xs font-medium opacity-90 flex-shrink-0">
            {eventInfo.timeText}
          </span>
        )}
        <span className="text-[11px] sm:text-xs font-medium truncate">
          {eventInfo.event.title}
        </span>
      </div>
    </div>
  );
};

export default Calendar;
