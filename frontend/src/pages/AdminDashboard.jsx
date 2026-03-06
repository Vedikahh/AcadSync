import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";
import "./Dashboard.css";

const MOCK_EVENTS = [
  {
    id: 1,
    title: "Annual Tech Fest 2025",
    description: "A two-day celebration of technology, innovation, and creativity.",
    date: "2025-11-15",
    venue: "Main Auditorium",
    organizer: "CSE Department",
    status: "pending",
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
    status: "approved",
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
];

const MOCK_STUDENTS = 428;
const MOCK_DEPARTMENTS = 8;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState(MOCK_EVENTS);

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
          <h1 className="dashboard-greeting">
            Admin Panel 🔑
          </h1>
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

      {/* Pending events for quick review */}
      <div className="dashboard-section" style={{ maxWidth: "100%" }}>
        <div className="section-title-row">
          <h2>
            Pending Approvals
            {pending.length > 0 && (
              <span className="unread-badge">{pending.length}</span>
            )}
          </h2>
          <Link to="/events" className="view-all-link">View all events →</Link>
        </div>
        {pending.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎉</span>
            <p>No pending events. All caught up!</p>
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
