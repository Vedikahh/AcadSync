import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";
import NotificationItem from "../components/NotificationItem";
import CalendarView from "../components/CalendarView";
import "./Dashboard.css";

// Mock data — replace with real API calls when backend is ready
const MOCK_EVENTS = [
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
];

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "approval",
    message: "Your event \"Annual Tech Fest 2025\" has been approved!",
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 2,
    type: "reminder",
    message: "Reminder: Tech Fest is in 3 days. Complete all arrangements.",
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 3,
    type: "announcement",
    message: "New academic calendar for 2025-26 has been released.",
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [events] = useState(MOCK_EVENTS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [eventsView, setEventsView] = useState("list"); // "list" | "calendar"

  const unreadCount = notifications.filter((n) => !n.read).length;
  const approvedEvents = events.filter((e) => e.status === "approved").length;
  const pendingEvents = events.filter((e) => e.status === "pending").length;

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-greeting">
            Hello, {user?.name || "Student"} 👋
          </h1>
          <p className="dashboard-sub">Here&apos;s what&apos;s happening on campus today.</p>
        </div>
        <Link to="/events" className="btn-primary">
          + Request Event
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card purple">
          <div className="stat-card-icon">📅</div>
          <div>
            <div className="stat-card-num">{events.length}</div>
            <div className="stat-card-label">My Events</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-card-icon">✅</div>
          <div>
            <div className="stat-card-num">{approvedEvents}</div>
            <div className="stat-card-label">Approved</div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-card-icon">⏳</div>
          <div>
            <div className="stat-card-num">{pendingEvents}</div>
            <div className="stat-card-label">Pending</div>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-icon">🔔</div>
          <div>
            <div className="stat-card-num">{unreadCount}</div>
            <div className="stat-card-label">Unread Alerts</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="dashboard-grid">
        {/* Events panel with List / Calendar toggle */}
        <div className="dashboard-section">
          <div className="section-title-row">
            <h2>My Events</h2>
            <div className="view-toggle-group">
              <button
                className={`view-toggle-btn ${eventsView === "list" ? "active" : ""}`}
                onClick={() => setEventsView("list")}
                aria-pressed={eventsView === "list"}
              >
                ☰ List
              </button>
              <button
                className={`view-toggle-btn ${eventsView === "calendar" ? "active" : ""}`}
                onClick={() => setEventsView("calendar")}
                aria-pressed={eventsView === "calendar"}
              >
                📅 Calendar
              </button>
            </div>
            <Link to="/events" className="view-all-link">View all →</Link>
          </div>

          {eventsView === "list" ? (
            <div className="events-list">
              {events.map((event) => (
                <EventCard key={event.id} event={event} isAdmin={false} />
              ))}
            </div>
          ) : (
            <CalendarView events={events} />
          )}
        </div>

        {/* Notifications */}
        <div className="dashboard-section">
          <div className="section-title-row">
            <h2>
              Notifications
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount}</span>
              )}
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
