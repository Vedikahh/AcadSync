import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";
import CalendarView from "../components/CalendarView";
import Modal from "../components/Modal";
import "./EventsPage.css";

const INITIAL_EVENTS = [
  {
    id: 1,
    title: "Annual Tech Fest 2025",
    description: "A two-day celebration of technology, innovation, and creativity for all students.",
    date: "2025-11-15",
    startTime: "09:00",
    endTime: "18:00",
    venue: "Main Auditorium",
    organizer: "CSE Department",
    category: "technical",
    attendees: 500,
    status: "approved",
  },
  {
    id: 2,
    title: "Cultural Night",
    description: "An evening of music, dance, and drama showcasing campus talent.",
    date: "2025-12-05",
    startTime: "17:00",
    endTime: "21:00",
    venue: "Open Air Stage",
    organizer: "Cultural Committee",
    category: "cultural",
    attendees: 300,
    status: "pending",
  },
  {
    id: 3,
    title: "Hackathon 2025",
    description: "24-hour coding marathon to solve real-world problems.",
    date: "2025-10-20",
    startTime: "08:00",
    endTime: "08:00",
    venue: "Lab Block C",
    organizer: "Tech Club",
    category: "technical",
    attendees: 120,
    status: "rejected",
  },
  {
    id: 4,
    title: "Sports Day",
    description: "Annual inter-department sports competition.",
    date: "2025-09-10",
    startTime: "06:00",
    endTime: "18:00",
    venue: "Sports Ground",
    organizer: "Sports Committee",
    category: "sports",
    attendees: 400,
    status: "approved",
  },
  {
    id: 5,
    title: "Alumni Meet 2025",
    description: "Annual gathering of alumni to reconnect and share experiences.",
    date: "2025-12-20",
    startTime: "10:00",
    endTime: "17:00",
    venue: "Conference Hall",
    organizer: "Alumni Cell",
    category: "academic",
    attendees: 200,
    status: "pending",
  },
];

const FILTERS = ["all", "pending", "approved", "rejected"];

const CATEGORIES = [
  { value: "technical", label: "🔧 Technical" },
  { value: "cultural", label: "🎭 Cultural" },
  { value: "sports", label: "⚽ Sports" },
  { value: "academic", label: "📚 Academic" },
  { value: "other", label: "🎉 Other" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  venue: "",
  organizer: "",
  category: "",
  attendees: "",
};

/** Returns 3 candidate alternate dates (±1, ±2, ±3 days) avoiding existing conflicts */
function suggestAlternateDates(date, venue, events) {
  if (!date) return [];
  const base = new Date(date + "T00:00:00");
  const suggestions = [];
  let offset = 1;
  while (suggestions.length < 3 && offset <= 14) {
    for (const sign of [1, -1]) {
      const candidate = new Date(base);
      candidate.setDate(base.getDate() + sign * offset);
      const candidateStr = candidate.toISOString().split("T")[0];
      const hasConflict = events.some(
        (e) =>
          e.date === candidateStr &&
          venue &&
          e.venue?.trim().toLowerCase() === venue.trim().toLowerCase() &&
          e.status !== "rejected"
      );
      if (!hasConflict) {
        suggestions.push(candidateStr);
        if (suggestions.length >= 3) break;
      }
    }
    offset++;
  }
  return suggestions.slice(0, 3);
}

export default function EventsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [eventsView, setEventsView] = useState("list"); // "list" | "calendar"
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const filtered = events.filter((e) => {
    if (filter !== "all" && e.status !== filter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleApprove = (id) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "approved" } : e)));

  const handleReject = (id) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "rejected" } : e)));

  const handleDelete = (id) =>
    setEvents((prev) => prev.filter((e) => e.id !== id));

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
  };

  /** Detect venue+date conflict with non-rejected events (Calendly-style) */
  const conflict = useMemo(() => {
    if (!form.date || !form.venue) return null;
    return events.find(
      (e) =>
        e.date === form.date &&
        e.venue?.trim().toLowerCase() === form.venue.trim().toLowerCase() &&
        e.status !== "rejected"
    ) || null;
  }, [form.date, form.venue, events]);

  const alternateDates = useMemo(
    () => (conflict ? suggestAlternateDates(form.date, form.venue, events) : []),
    [conflict, form.date, form.venue, events]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      setFormError("Title and description are required.");
      return;
    }
    const newEvent = {
      id: Date.now(),
      ...form,
      attendees: form.attendees ? parseInt(form.attendees, 10) : undefined,
      organizer: form.organizer || user?.name || "Unknown",
      status: "pending",
    };
    setEvents((prev) => [newEvent, ...prev]);
    setModalOpen(false);
    setForm(EMPTY_FORM);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  return (
    <div className="events-page">
      <div className="events-header">
        <div>
          <h1>Campus Events</h1>
          <p>{filtered.length} event{filtered.length !== 1 ? "s" : ""} found</p>
        </div>
        <div className="events-header-actions">
          {/* List / Calendar toggle */}
          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${eventsView === "list" ? "active" : ""}`}
              onClick={() => setEventsView("list")}
            >
              ☰ List
            </button>
            <button
              className={`view-toggle-btn ${eventsView === "calendar" ? "active" : ""}`}
              onClick={() => setEventsView("calendar")}
            >
              📅 Calendar
            </button>
          </div>
          {!isAdmin && (
            <button className="btn-request" onClick={() => setModalOpen(true)}>
              + Request Event
            </button>
          )}
        </div>
      </div>

      {/* Search + Filter (only in list view) */}
      {eventsView === "list" && (
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
      )}

      {/* Events content */}
      {eventsView === "calendar" ? (
        <div className="events-calendar-wrapper">
          <CalendarView events={events} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-events">
          <span>📭</span>
          <p>No events match your filter.</p>
        </div>
      ) : (
        <div className="events-grid">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isAdmin={isAdmin}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={!isAdmin ? handleDelete : undefined}
            />
          ))}
        </div>
      )}

      {/* Request Event Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Request New Event"
      >
        {formError && <div className="form-error">{formError}</div>}

        {/* Conflict warning + alternate date suggestions (Calendly-inspired) */}
        {conflict && (
          <div className="conflict-warning">
            <div className="conflict-warning-title">
              ⚠️ Scheduling Conflict Detected
            </div>
            <p className="conflict-warning-body">
              <strong>{conflict.venue}</strong> is already booked on{" "}
              <strong>
                {new Date(conflict.date + "T00:00:00").toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </strong>{" "}
              for <em>{conflict.title}</em>.
            </p>
            {alternateDates.length > 0 && (
              <div className="alt-dates">
                <span className="alt-dates-label">Suggested alternate dates:</span>
                <div className="alt-dates-list">
                  {alternateDates.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className="alt-date-btn"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, date: d }));
                      }}
                    >
                      {new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="event-form">
          {/* Title */}
          <div className="form-group">
            <label>Event Title *</label>
            <input
              name="title"
              type="text"
              placeholder="e.g. Annual Tech Fest"
              value={form.title}
              onChange={handleFormChange}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              placeholder="Describe the event…"
              value={form.description}
              onChange={handleFormChange}
              rows={3}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label>Category</label>
            <div className="category-selector">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  className={`category-btn ${form.category === cat.value ? "active" : ""}`}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      category: prev.category === cat.value ? "" : cat.value,
                    }))
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Venue */}
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>Venue</label>
              <input
                name="venue"
                type="text"
                placeholder="e.g. Main Auditorium"
                value={form.venue}
                onChange={handleFormChange}
              />
            </div>
          </div>

          {/* Start + End time */}
          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input
                name="startTime"
                type="time"
                value={form.startTime}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input
                name="endTime"
                type="time"
                value={form.endTime}
                onChange={handleFormChange}
              />
            </div>
          </div>

          {/* Organizer + Expected Attendees */}
          <div className="form-row">
            <div className="form-group">
              <label>Organizer / Department</label>
              <input
                name="organizer"
                type="text"
                placeholder="e.g. CSE Department"
                value={form.organizer}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>Expected Attendees</label>
              <input
                name="attendees"
                type="number"
                min="1"
                placeholder="e.g. 200"
                value={form.attendees}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
