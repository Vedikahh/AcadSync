import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyEvents, deleteEvent } from "../services/api";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";
import socket from "../services/socket";
import "./MyEvents.css";

const FILTERS = ["all", "requested", "approved", "cancelled", "completed", "rejected"];

export default function MyEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyEvents();

    socket.on("calendarUpdate", fetchMyEvents);
    return () => {
      socket.off("calendarUpdate", fetchMyEvents);
    };
  }, []);

  const fetchMyEvents = async () => {
    try {
      setIsLoading(true);
      const data = await getMyEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch my events", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event request?")) return;
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e._id !== id && e.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
      alert(err.message || "Failed to delete event");
    }
  };

  const resolveStatus = (event) => {
    if (event.isCompleted && event.status === "approved") return "completed";
    if (event.status === "pending") return "requested";
    return event.status;
  };

  const filtered = events.filter((event) => {
    const status = resolveStatus(event);
    if (filter !== "all" && status !== filter) return false;

    if (search) {
      const q = search.toLowerCase();
      const title = (event.title || "").toLowerCase();
      const dept = (event.department || "").toLowerCase();
      if (!title.includes(q) && !dept.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="my-events-page">
      <div className="my-events-header">
        <div>
          <h1>My Events</h1>
          <p>Track your requested, approved, cancelled, and completed events</p>
        </div>
        <button className="my-events-create" onClick={() => navigate("/create-event")}>+ Request Event</button>
      </div>

      <div className="my-events-controls">
        <input
          className="my-events-search"
          type="text"
          placeholder="Search by title or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="my-events-tabs">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`my-events-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="my-events-empty">Loading your events...</div>
      ) : filtered.length === 0 ? (
        <div className="my-events-empty">No events found for this filter.</div>
      ) : (
        <div className="my-events-grid">
          {filtered.map((event) => {
            const normalized = { ...event, id: event._id || event.id };
            return (
              <EventCard
                key={normalized.id}
                event={normalized}
                user={user}
                isAdmin={false}
                onEdit={(ev) => navigate("/create-event", { state: { eventData: ev } })}
                onDelete={() => handleDelete(normalized.id)}
                onClick={() => navigate(`/events/${normalized.id}`, { state: { event: normalized } })}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
