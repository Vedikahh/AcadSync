import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getEvents, updateEventStatus, deleteEvent } from "../services/api";
import EventCard from "../components/EventCard";
import EventModal from "../components/EventModal";
import socket from "../services/socket";
import "./EventsPage.css";

const FILTERS = ["all", "pending", "approved", "rejected"];

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();

    socket.on('calendarUpdate', fetchEvents);
    return () => { socket.off('calendarUpdate', fetchEvents); };
  }, []);


  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch events", err);
      setError("We could not load events right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = events.filter((e) => {
    if (filter !== "all" && e.status !== filter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleApprove = async (id) => {
    try {
      const noteInput = window.prompt("Optional approval note for organizer (leave blank to skip):", "");
      if (noteInput === null) return;

      const updated = await updateEventStatus(
        id,
        "approved",
        noteInput.trim() ? { note: noteInput.trim() } : {}
      );
      setEvents((prev) => prev.map((e) => ((e._id === id || e.id === id) ? updated : e)));
    } catch (err) { console.error("Update failed", err); }
  };

  const handleReject = async (id) => {
    try {
      const reasonInput = window.prompt("Rejection reason (required):", "");
      if (reasonInput === null) return;

      const rejectionReason = reasonInput.trim();
      if (!rejectionReason) return;

      const noteInput = window.prompt("Optional admin note (additional context):", "");
      if (noteInput === null) return;

      const updated = await updateEventStatus(id, "rejected", {
        rejectionReason,
        ...(noteInput.trim() ? { note: noteInput.trim() } : {}),
      });
      setEvents((prev) => prev.map((e) => ((e._id === id || e.id === id) ? updated : e)));
    } catch (err) { console.error("Update failed", err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e._id !== id && e.id !== id));
    } catch (err) { console.error("Delete failed", err); }
  };

  const handleEdit = (event) => {
    navigate("/create-event", { state: { eventData: event } });
  };

  return (
    <div className="events-page">
      <div className="events-header">
        <div>
          <h1>Campus Events</h1>
          <p>{filtered.length} event{filtered.length !== 1 ? "s" : ""} found</p>
        </div>
        {(isAdmin || user?.role === "organizer") && (
          <button className="btn-request" onClick={() => navigate("/create-event")}>
            + Request Event
          </button>
        )}
      </div>

      <div className="events-controls">
        <label htmlFor="events-search" className="sr-only">Search events</label>
        <input
          id="events-search"
          className="search-input"
          type="text"
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search events by title"
        />
        <div className="filter-tabs" role="tablist" aria-label="Filter events by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
              role="tab"
              aria-selected={filter === f}
              aria-controls="events-grid"
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="events-state" role="status" aria-live="polite">
          Loading events...
        </div>
      ) : error ? (
        <div className="events-state events-state-error" role="alert">
          <p>{error}</p>
          <button className="events-retry-btn" onClick={fetchEvents}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-events" role="status" aria-live="polite">
          <span>📭</span>
          <p>No events match your current search and filter.</p>
        </div>
      ) : (
        <div className="events-grid" id="events-grid">
          {filtered.map((event) => {
            const normalizedEvent = { ...event, id: event._id || event.id };
            return (
              <EventCard
                key={normalizedEvent.id}
                event={normalizedEvent}
                user={user}
                isAdmin={isAdmin}
                onApprove={() => handleApprove(normalizedEvent.id)}
                onReject={() => handleReject(normalizedEvent.id)}
                onDelete={() => handleDelete(normalizedEvent.id)}
                onEdit={handleEdit}
                onClick={() => setSelectedEvent(normalizedEvent)}
              />
            )
          })}
        </div>
      )}

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
