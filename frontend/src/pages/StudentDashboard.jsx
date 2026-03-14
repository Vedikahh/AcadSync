import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";
import NotificationItem from "../components/NotificationItem";
import ConflictCard from "../components/ConflictCard";
import StatsCard from "../components/StatsCard";
import "./StudentDashboard.css";

const MOCK_EVENTS = [
  { id: 1, title: "Annual Tech Fest 2025", description: "A two-day celebration of technology, innovation, and creativity.", date: "2025-11-15", venue: "Main Auditorium", organizer: "CSE Department", status: "approved" },
  { id: 2, title: "Cultural Night", description: "An evening of music, dance, and drama showcasing campus talent.", date: "2025-12-05", venue: "Open Air Stage", organizer: "Cultural Committee", status: "pending" },
  { id: 3, title: "Hackathon 2025", description: "24-hour coding marathon solve real-world problems.", date: "2025-10-20", venue: "Lab Block C", organizer: "Tech Club", status: "rejected" },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "approval", message: "Your event \"Annual Tech Fest 2025\" has been approved!", read: false, link: "/events", created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 2, type: "reminder", message: "Reminder: Tech Fest is in 3 days. Complete all arrangements.", read: false, link: "/events", created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 3, type: "announcement", message: "New academic calendar for 2025-26 has been released.", read: true, link: "/calendar", created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
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

  const handleNotifClick = (notif) => {
    if (!notif.read) markRead(notif.id);
  };

  return (
    <div className="std-db-page">
      {/* Header */}
      <div className="std-header">
        <div className="std-greeting-box">
          <h1 className="std-title">Hello, {user?.name || "Student"}</h1>
          <p className="std-subtitle">Welcome to your student portal. Here's what's happening on campus today.</p>
        </div>
        <div className="std-actions">
          <Link to="/events" className="std-btn-outline">Browse Events</Link>
          <Link to="/create-event" className="std-btn-primary">
            <span className="std-btn-icon">+</span> Propose Event
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="std-stats-grid">
        <StatsCard icon="◈" value={events.length}  label="My Events"    color="purple" />
        <StatsCard icon="✓" value={approvedEvents} label="Approved"     color="green"  />
        <StatsCard icon="…" value={pendingEvents}  label="Pending"      color="orange" />
        <StatsCard icon="◉" value={unreadCount}    label="Unread Alerts" color="blue"  />
      </div>

      {/* Layout Grid */}
      <div className="std-layout">
        
        {/* Main Content Column */}
        <div className="std-main-col">
          
          {/* Conflict Alerts */}
          {MOCK_CONFLICTS.length > 0 && (
            <section className="std-card std-conflict-section">
              <div className="std-card-header std-conflict-header">
                <div className="std-card-title-wrap">
                  <div className="std-alert-icon">!</div>
                  <h2 className="std-card-title">Action Required: Schedule Conflict</h2>
                </div>
                <Link to="/conflict" className="std-link">Resolve →</Link>
              </div>
              <div className="std-card-body">
                <p className="std-conflict-desc">
                  One or more of your events conflicts with the official academic calendar. Please review.
                </p>
                <div className="std-conflict-list">
                  {MOCK_CONFLICTS.map((c) => (
                    <ConflictCard key={c.id} conflict={c} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* My Events */}
          <section className="std-card">
            <div className="std-card-header">
              <div className="std-card-title-wrap">
                <h2 className="std-card-title">My Event Proposals</h2>
                <div className="std-badge std-badge-purple">{events.length} Total</div>
              </div>
              <Link to="/events" className="std-link">View all →</Link>
            </div>
            <div className="std-card-body std-bg-gray">
              {events.length === 0 ? (
                <div className="std-empty">
                  <div className="std-empty-icon">◈</div>
                  <p>You haven't proposed any events yet.</p>
                  <Link to="/create-event" className="std-btn-primary std-mt-10">Create Event</Link>
                </div>
              ) : (
                <div className="std-events-list">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} isAdmin={false} />
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Side Content Column */}
        <div className="std-side-col">
          
          {/* Notifications */}
          <section className="std-card std-notification-card">
            <div className="std-card-header">
              <div className="std-card-title-wrap">
                <h2 className="std-card-title">Notifications</h2>
                {unreadCount > 0 && <span className="std-badge std-badge-blue">{unreadCount} New</span>}
              </div>
              <Link to="/notifications" className="std-link">Inbox →</Link>
            </div>
            <div className="std-card-body std-p-0">
              {notifications.length === 0 ? (
                <div className="std-empty">
                  <p>You have no notifications.</p>
                </div>
              ) : (
                <div className="std-notif-list">
                  {notifications.map((n) => (
                    <NotificationItem 
                      key={n.id} 
                      notification={n} 
                      onMarkRead={markRead}
                      onClick={handleNotifClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Quick Links Widget */}
          <section className="std-card">
            <div className="std-card-header">
              <h2 className="std-card-title">Quick Links</h2>
            </div>
            <div className="std-card-body">
              <div className="std-quick-links">
                <Link to="/calendar" className="std-quick-link">
                  <div className="std-ql-icon bg-purple">▦</div>
                  <div className="std-ql-text">
                    <span className="std-ql-title">Academic Calendar</span>
                    <span className="std-ql-sub">View classes & exams</span>
                  </div>
                </Link>
                <Link to="/profile" className="std-quick-link">
                  <div className="std-ql-icon bg-blue">◯</div>
                  <div className="std-ql-text">
                    <span className="std-ql-title">My Profile</span>
                    <span className="std-ql-sub">Manage account details</span>
                  </div>
                </Link>
              </div>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
