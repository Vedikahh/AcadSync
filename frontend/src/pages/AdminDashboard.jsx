import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";
import CalendarView from "../components/CalendarView";
import "./Dashboard.css";

const MOCK_EVENTS = [
  {
    id: 1,
    title: "Annual Tech Fest 2025",
    description: "A two-day celebration of technology, innovation, and creativity.",
    date: "2025-11-15",
    startTime: "09:00",
    endTime: "18:00",
    venue: "Main Auditorium",
    organizer: "CSE Department",
    category: "technical",
    attendees: 500,
    status: "pending",
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
    status: "approved",
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
];

const MOCK_STUDENTS = 428;
const MOCK_DEPARTMENTS = 8;

const STATUS_BADGE = {
  pending: { label: "Pending", cls: "tbl-badge-pending" },
  approved: { label: "Approved", cls: "tbl-badge-approved" },
  rejected: { label: "Rejected", cls: "tbl-badge-rejected" },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [pendingView, setPendingView] = useState("table"); // "table" | "cards"
  const [calView, setCalView] = useState(false);

  const pending = events.filter((e) => e.status === "pending");
  const approved = events.filter((e) => e.status === "approved");

  const handleApprove = (id) =>
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "approved" } : e))
    );

  const handleReject = (id) =>
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "rejected" } : e))
    );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-greeting">Admin Panel 🔑</h1>
          <p className="dashboard-sub">
            Welcome, {user?.name}. Manage events and campus activities.
          </p>
        </div>
        <Link to="/events" className="btn-primary">
          Manage All Events
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card blue">
          <div className="stat-card-icon">👨‍🎓</div>
          <div>
            <div className="stat-card-num">{MOCK_STUDENTS}</div>
            <div className="stat-card-label">Students</div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-card-icon">⏳</div>
          <div>
            <div className="stat-card-num">{pending.length}</div>
            <div className="stat-card-label">Pending Approval</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-card-icon">✅</div>
          <div>
            <div className="stat-card-num">{approved.length}</div>
            <div className="stat-card-label">Approved Events</div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-card-icon">🏢</div>
          <div>
            <div className="stat-card-num">{MOCK_DEPARTMENTS}</div>
            <div className="stat-card-label">Departments</div>
          </div>
        </div>
      </div>

      {/* Calendar section */}
      <div className="dashboard-section" style={{ maxWidth: "100%" }}>
        <div className="section-title-row">
          <h2>Campus Calendar</h2>
          <button
            className={`view-toggle-btn ${calView ? "active" : ""}`}
            style={{ marginLeft: "auto" }}
            onClick={() => setCalView((v) => !v)}
          >
            {calView ? "Hide Calendar" : "📅 Show Calendar"}
          </button>
        </div>
        {calView && <CalendarView events={events} />}
      </div>

      {/* Pending events — Notion-style table or card toggle */}
      <div className="dashboard-section" style={{ maxWidth: "100%" }}>
        <div className="section-title-row">
          <h2>
            Pending Approvals
            {pending.length > 0 && (
              <span className="unread-badge">{pending.length}</span>
            )}
          </h2>
          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${pendingView === "table" ? "active" : ""}`}
              onClick={() => setPendingView("table")}
            >
              ☰ Table
            </button>
            <button
              className={`view-toggle-btn ${pendingView === "cards" ? "active" : ""}`}
              onClick={() => setPendingView("cards")}
            >
              ⊞ Cards
            </button>
          </div>
          <Link to="/events" className="view-all-link">View all events →</Link>
        </div>

        {pending.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎉</span>
            <p>No pending events. All caught up!</p>
          </div>
        ) : pendingView === "table" ? (
          /* Notion-inspired structured table */
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Organizer</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Attendees</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <div className="tbl-event-title">{ev.title}</div>
                      {ev.category && (
                        <span className={`tbl-category tbl-cat-${ev.category}`}>
                          {ev.category}
                        </span>
                      )}
                    </td>
                    <td className="tbl-muted">{ev.organizer}</td>
                    <td className="tbl-muted">
                      {ev.date
                        ? new Date(ev.date + "T00:00:00").toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "TBD"}
                      {ev.startTime && (
                        <div className="tbl-time">
                          {ev.startTime}
                          {ev.endTime ? ` – ${ev.endTime}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="tbl-muted">{ev.venue || "TBD"}</td>
                    <td className="tbl-muted">{ev.attendees ?? "—"}</td>
                    <td>
                      <span className={`tbl-badge ${STATUS_BADGE[ev.status]?.cls}`}>
                        {STATUS_BADGE[ev.status]?.label}
                      </span>
                    </td>
                    <td>
                      <div className="tbl-actions">
                        <button
                          className="tbl-btn-approve"
                          onClick={() => handleApprove(ev.id)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="tbl-btn-reject"
                          onClick={() => handleReject(ev.id)}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="events-grid-3">
            {pending.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isAdmin
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recently approved */}
      <div className="dashboard-section" style={{ maxWidth: "100%" }}>
        <div className="section-title-row">
          <h2>Recently Approved</h2>
        </div>
        <div className="events-grid-3">
          {approved.map((event) => (
            <EventCard key={event.id} event={event} isAdmin />
          ))}
        </div>
      </div>
    </div>
  );
}
