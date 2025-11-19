import { DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useEffect, useRef, useState } from "react";
import {
  createEvent,
  deleteEvent,
  eventTypeConfig,
  getUserEvents,
  updateEvent,
  type EventType,
} from "../api/mock-calendar";
import PageMeta from "../components/common/PageMeta";
import { Modal } from "../components/ui/modal";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../hooks/useModal";

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
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  // Charger les événements de l'utilisateur
  useEffect(() => {
    if (!user) return;

    const loadEvents = async () => {
      setLoading(true);
      try {
        const userEvents = await getUserEvents(user.id);
        const formattedEvents: CalendarEvent[] = userEvents.map((event) => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.allDay || false,
          backgroundColor: eventTypeConfig[event.type].color,
          borderColor: eventTypeConfig[event.type].color,
          extendedProps: {
            type: event.type,
            description: event.description,
            projectId: event.projectId,
            taskId: event.taskId,
          },
        }));
        setEvents(formattedEvents);
      } catch (error) {
        console.error("Erreur lors du chargement des événements:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [user]);

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

  const handleAddOrUpdateEvent = async () => {
    if (!user || !eventTitle.trim()) return;

    const startDateTime = allDay
      ? eventStartDate
      : `${eventStartDate}T${eventStartTime}:00`;
    const endDateTime = allDay
      ? eventEndDate
      : `${eventEndDate}T${eventEndTime}:00`;

    try {
      if (selectedEvent) {
        // Update existing event
        await updateEvent(selectedEvent.id, {
          title: eventTitle,
          description: eventDescription,
          type: eventType,
          start: startDateTime,
          end: endDateTime,
          allDay,
          userId: user.id,
        });

        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === selectedEvent.id
              ? {
                  ...event,
                  title: eventTitle,
                  start: startDateTime,
                  end: endDateTime,
                  allDay,
                  backgroundColor: eventTypeConfig[eventType].color,
                  borderColor: eventTypeConfig[eventType].color,
                  extendedProps: {
                    type: eventType,
                    description: eventDescription,
                  },
                }
              : event
          )
        );
      } else {
        // Add new event
        const newEvent = await createEvent({
          userId: user.id,
          title: eventTitle,
          description: eventDescription,
          type: eventType,
          start: startDateTime,
          end: endDateTime,
          allDay,
        });

        const formattedEvent: CalendarEvent = {
          id: newEvent.id,
          title: newEvent.title,
          start: newEvent.start,
          end: newEvent.end,
          allDay: newEvent.allDay || false,
          backgroundColor: eventTypeConfig[newEvent.type].color,
          borderColor: eventTypeConfig[newEvent.type].color,
          extendedProps: {
            type: newEvent.type,
            description: newEvent.description,
          },
        };
        setEvents((prevEvents) => [...prevEvents, formattedEvent]);
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
      await deleteEvent(selectedEvent.id);
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== selectedEvent.id)
      );
      closeModal();
      resetModalFields();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression de l'événement");
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
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "addEventButton,dayGridMonth,timeGridWeek,timeGridDay",
            }}
            slotMinTime="08:00:00"
            slotMaxTime="19:00:00"
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            allDaySlot={true}
            weekends={true}
            nowIndicator={true}
            locale="fr"
            eventMinHeight={30}
            eventShortHeight={30}
            buttonText={{
              today: "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
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
          className="max-w-[700px] p-4 sm:p-6 lg:p-10 max-h-[90vh]"
        >
          <div className="flex overflow-y-auto flex-col px-2 custom-scrollbar max-h-[calc(90vh-2rem)]">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-lg sm:text-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Modifier l'événement" : "Nouvel événement"}
              </h5>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Organisez votre emploi du temps et planifiez vos activités
              </p>
            </div>
            <div className="mt-8">
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
              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Description
                </label>
                <textarea
                  id="event-description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Détails de l'événement..."
                  rows={3}
                  className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              {/* Type d'événement */}
              <div className="mt-6">
                <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Type d'événement <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3">
                  {Object.entries(eventTypeConfig).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEventType(key as EventType)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all ${
                        eventType === key
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      }`}
                    >
                      <span className="text-base sm:text-xl">
                        {config.icon}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                        {config.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toute la journée */}
              <div className="mt-6">
                <label className="flex gap-2 items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                    Toute la journée
                  </span>
                </label>
              </div>

              {/* Date et heure de début */}
              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Début <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    id="event-start-date"
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    required
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  {!allDay && (
                    <input
                      id="event-start-time"
                      type="time"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      required
                      className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  )}
                </div>
              </div>

              {/* Date et heure de fin */}
              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Fin <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    id="event-end-date"
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    required
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  {!allDay && (
                    <input
                      id="event-end-time"
                      type="time"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      required
                      className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center mt-6 modal-footer sm:justify-end">
              {selectedEvent && (
                <button
                  onClick={handleDeleteEvent}
                  type="button"
                  className="flex w-full sm:w-auto justify-center rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20 order-3 sm:order-1"
                >
                  Supprimer
                </button>
              )}
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full sm:w-auto justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] order-2"
              >
                Annuler
              </button>
              <button
                onClick={handleAddOrUpdateEvent}
                type="button"
                className="btn btn-success btn-update-event flex w-full sm:w-auto justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 order-1 sm:order-3"
              >
                {selectedEvent ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: {
  event: { extendedProps: { type: EventType }; title: string };
  timeText: string;
}) => {
  const eventType = eventInfo.event.extendedProps.type;
  const config = eventTypeConfig[eventType];

  return (
    <div className="flex items-start gap-1 px-1 py-0.5 overflow-hidden text-white">
      <span className="text-[10px] leading-none mt-0.5">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold leading-tight truncate">
          {eventInfo.event.title}
        </div>
        {eventInfo.timeText && (
          <div className="text-[10px] leading-tight opacity-90">
            {eventInfo.timeText}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
