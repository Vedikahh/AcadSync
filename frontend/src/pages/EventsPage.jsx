import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";
import Modal from "../components/Modal";
import "./EventsPage.css";

const INITIAL_EVENTS = [
  {
    id: 1,
    title: "Annual Tech Fest 2025",
    description: "A two-day celebration of technology, innovation, and creativity for all students.",
    date: "2025-11-15",
    venue: "Main Auditorium",
    organizer: "CSE Department",
    status: "approved",
  },
  {
    id: 2,
    title: "Cultural Night",
    description: "An evening of music, dance, and drama showcasing campus talent.",
    date: "2025-12-05",
    venue: "Open Air Stage",
    organizer: "Cultural Committee",
    status: "pending",
  },
  {
    id: 3,
    title: "Hackathon 2025",
    description: "24-hour coding marathon to solve real-world problems.",
    date: "2025-10-20",
    venue: "Lab Block C",
    organizer: "Tech Club",
    status: "rejected",
  },
  {
    id: 4,
    title: "Sports Day",
    description: "Annual inter-department sports competition.",
    date: "2025-09-10",
    venue: "Sports Ground",
    organizer: "Sports Committee",
    status: "approved",
  },
  {
    id: 5,
    title: "Alumni Meet 2025",
    description: "Annual gathering of alumni to reconnect and share experiences.",
    date: "2025-12-20",
    venue: "Conference Hall",
    organizer: "Alumni Cell",
    status: "pending",
  },
];

const FILTERS = ["all", "pending", "approved", "rejected"];

const EMPTY_FORM = { title: "", description: "", date: "", venue: "", organizer: "" };

export default function EventsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      setFormError("Title and description are required.");
      return;
    }
    const newEvent = {
      id: Date.now(),
      ...form,
      organizer: form.organizer || user?.name || "Unknown",
      status: "pending",
    };
    setEvents((prev) => [newEvent, ...prev]);
    setModalOpen(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="events-page">
      <div className="events-header">
        <div>
          <h1>Campus Events</h1>
          <p>{filtered.length} event{filtered.length !== 1 ? "s" : ""} found</p>
        </div>
        {!isAdmin && (
          <button className="btn-request" onClick={() => setModalOpen(true)}>
            + Request Event
          </button>
        )}
      </div>

      {/* Search + Filter */}
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

      {/* Events grid */}
      {filtered.length === 0 ? (
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
        onClose={() => { setModalOpen(false); setForm(EMPTY_FORM); setFormError(""); }}
        title="Request New Event"
      >
        {formError && <div className="form-error">{formError}</div>}
        <form onSubmit={handleSubmit} className="event-form">
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
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => { setModalOpen(false); setForm(EMPTY_FORM); }}
            >
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
