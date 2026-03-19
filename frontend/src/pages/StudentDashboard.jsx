import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getEvents, getNotifications, markNotificationRead } from "../services/api";
import EventCard from "../components/EventCard";
import NotificationItem from "../components/NotificationItem";
import ConflictCard from "../components/ConflictCard";
import StatsCard from "../components/StatsCard";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getEvents().catch(() => []),
      getNotifications().catch(() => [])
    ]).then(([eventsData, notifsData]) => {
      // For student, show all approved campus events
      const approvedEventsList = Array.isArray(eventsData) ? eventsData.filter(e => e.status === "approved") : [];
      setEvents(approvedEventsList);
      
      setNotifications(Array.isArray(notifsData) ? notifsData : []);
      setIsLoading(false);
    });
  }, [user]);

  const unreadCount    = notifications.filter((n) => !n.read).length;
  const totalApproved  = events.length;
  const MOCK_CONFLICTS = []; // Empty out dummy conflicts

  const markRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => ((n._id === id || n.id === id) ? { ...n, read: true } : n)));
    } catch (err) { console.error(err); }
  };

  const handleNotifClick = (notif) => {
    const id = notif._id || notif.id;
    if (!notif.read) markRead(id);
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
          <Link to="/calendar" className="std-btn-outline">Academic Calendar</Link>
          <Link to="/events" className="std-btn-primary">
            Browse Events
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="std-stats-grid">
        <StatsCard icon="◈" value={totalApproved}  label="Campus Events" color="purple" />
        <StatsCard icon="✓" value="Today"          label="Active Day"    color="green"  />
        <StatsCard icon="▦" value="8"              label="Classes Today" color="orange" />
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
                <h2 className="std-card-title">Approved Campus Events</h2>
                <div className="std-badge std-badge-purple">{events.length} Upcoming</div>
              </div>
              <Link to="/events" className="std-link">View all →</Link>
            </div>
            <div className="std-card-body std-bg-gray">
              {isLoading ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>Loading events...</div>
              ) : events.length === 0 ? (
                <div className="std-empty">
                  <div className="std-empty-icon">◈</div>
                  <p>No upcoming events at the moment.</p>
                </div>
              ) : (
                <div className="std-events-list">
                  {events.map((event) => {
                    const id = event._id || event.id;
                    return (
                      <EventCard key={id} event={{...event, id}} isAdmin={false} />
                    );
                  })}
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
              {isLoading ? (
                 <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="std-empty">
                  <p>You have no notifications.</p>
                </div>
              ) : (
                <div className="std-notif-list">
                  {notifications.map((n) => {
                    const id = n._id || n.id;
                    return (
                      <NotificationItem 
                        key={id} 
                        notification={{...n, id}} 
                        onMarkRead={() => markRead(id)}
                        onClick={() => handleNotifClick(n)}
                      />
                    );
                  })}
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
