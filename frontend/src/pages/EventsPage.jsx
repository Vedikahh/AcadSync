import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getEvents, updateEventStatus, deleteEvent } from "../services/api";
import EventCard from "../components/EventCard";
import socket from "../services/socket";
import "./EventsPage.css";

const FILTERS = ["all", "pending", "approved", "cancelled", "rejected"];

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();

    socket.on('calendarUpdate', fetchEvents);
    return () => { socket.off('calendarUpdate', fetchEvents); };
  }, []);


  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch events", err);
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
    if (!window.confirm("Approve this request? Once approved, it cannot be rejected.")) return;
    try {
      await updateEventStatus(id, "approved");
      setEvents((prev) => prev.map((e) => ((e._id === id || e.id === id) ? { ...e, status: "approved" } : e)));
    } catch (err) { console.error("Update failed", err); }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this request?")) return;
    try {
      await updateEventStatus(id, "rejected");
      setEvents((prev) => prev.map((e) => ((e._id === id || e.id === id) ? { ...e, status: "rejected" } : e)));
    } catch (err) { console.error("Update failed", err); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this approved event? Once cancelled, it cannot be approved again.")) return;
    try {
      await updateEventStatus(id, "cancelled");
      setEvents((prev) => prev.map((e) => ((e._id === id || e.id === id) ? { ...e, status: "cancelled" } : e)));
    } catch (err) { console.error("Cancel failed", err); }
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
        <input
          className="search-input"
          type="text"
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading events...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-events">
          <span>📭</span>
          <p>No events match your filter.</p>
        </div>
      ) : (
        <div className="events-grid">
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
                onCancel={() => handleCancel(normalizedEvent.id)}
                onDelete={() => handleDelete(normalizedEvent.id)}
                onEdit={handleEdit}
                onClick={() => navigate(`/events/${normalizedEvent.id}`, { state: { event: normalizedEvent } })}
              />
            )
          })}
        </div>
      )}
    </div>
  );
}
