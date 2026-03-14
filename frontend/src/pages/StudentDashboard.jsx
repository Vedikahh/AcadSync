import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";
import NotificationItem from "../components/NotificationItem";
import ConflictCard from "../components/ConflictCard";
import StatsCard from "../components/StatsCard";
import "./Dashboard.css";

const MOCK_EVENTS = [
  { id: 1, title: "Annual Tech Fest 2025", description: "A two-day celebration of technology, innovation, and creativity.", date: "2025-11-15", venue: "Main Auditorium", organizer: "CSE Department", status: "approved" },
  { id: 2, title: "Cultural Night", description: "An evening of music, dance, and drama showcasing campus talent.", date: "2025-12-05", venue: "Open Air Stage", organizer: "Cultural Committee", status: "pending" },
  { id: 3, title: "Hackathon 2025", description: "24-hour coding marathon to solve real-world problems.", date: "2025-10-20", venue: "Lab Block C", organizer: "Tech Club", status: "rejected" },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "approval", message: "Your event \"Annual Tech Fest 2025\" has been approved!", read: false, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 2, type: "reminder", message: "Reminder: Tech Fest is in 3 days. Complete all arrangements.", read: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 3, type: "announcement", message: "New academic calendar for 2025-26 has been released.", read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
];

const MOCK_CONFLICTS = [
  { id: 1, eventName: "Annual Tech Fest 2025", severity: "high", clashWith: "Data Structures & Algorithms — CSE Sem 3", timeOverlap: "09:00 – 10:00", venue: "Main Auditorium", date: "Nov 15, 2025", affectedStudents: 120 },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [events] = useState(MOCK_EVENTS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount    = notifications.filter((n) => !n.read).length;
  const approvedEvents = events.filter((e) => e.status === "approved").length;
  const pendingEvents  = events.filter((e) => e.status === "pending").length;

  const markRead = (id) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-greeting">Hello, {user?.name || "Student"}</h1>
          <p className="dashboard-sub">Here&apos;s what&apos;s happening on campus today.</p>
        </div>
        <Link to="/create-event" className="btn-primary">
          + Propose Event
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <StatsCard icon="◈" value={events.length}  label="My Events"    color="purple" />
        <StatsCard icon="✓"  value={approvedEvents} label="Approved"     color="green"  />
        <StatsCard icon="…"  value={pendingEvents}  label="Pending"      color="orange" />
        <StatsCard icon="◉"  value={unreadCount}    label="Unread Alerts" color="blue"  />
      </div>

      {/* Conflict Alerts */}
      {MOCK_CONFLICTS.length > 0 && (
        <div className="dashboard-section" style={{ maxWidth: "100%" }}>
          <div className="section-title-row">
            <h2>Conflict Alerts</h2>
            <Link to="/conflict" className="view-all-link">Details →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {MOCK_CONFLICTS.map((c) => (
              <ConflictCard key={c.id} conflict={c} />
            ))}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="dashboard-grid">
        {/* My Events */}
        <div className="dashboard-section">
          <div className="section-title-row">
            <h2>My Events</h2>
            <Link to="/events" className="view-all-link">View all →</Link>
          </div>
          <div className="events-list">
            {events.map((event) => (
              <EventCard key={event.id} event={event} isAdmin={false} />
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="dashboard-section">
          <div className="section-title-row">
            <h2>
              Notifications
              {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </h2>
            <Link to="/notifications" className="view-all-link">View all →</Link>
          </div>
          <div className="notifications-list">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onMarkRead={markRead} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
