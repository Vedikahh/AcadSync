import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Calendar, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getEvents, getNotifications, getDashboardStats, markNotificationRead } from "../services/api";
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
  const [pageError, setPageError] = useState("");
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [stats, setStats] = useState({
    campusEvents: 0,
    activeDay: "Today",
    classesToday: 0,
    conflictAlerts: 0,
    unreadNotifications: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setPageError("");

      const [eventsResult, notifsResult] = await Promise.allSettled([
        getEvents(),
        getNotifications(),
      ]);

      if (eventsResult.status === "fulfilled") {
        const approvedEventsList = Array.isArray(eventsResult.value)
          ? eventsResult.value.filter((event) => event.status === "approved")
          : [];
        setEvents(approvedEventsList);
      } else {
        setEvents([]);
        setPageError(eventsResult.reason?.message || "Failed to load events.");
      }

      if (notifsResult.status === "fulfilled") {
        setNotifications(Array.isArray(notifsResult.value) ? notifsResult.value : []);
      } else {
        setNotifications([]);
        setPageError((prev) => prev || notifsResult.reason?.message || "Failed to load notifications.");
      }

      setIsLoading(false);
    };

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError("");
        const data = await getDashboardStats();
        setStats({
          campusEvents: data?.stats?.campusEvents ?? 0,
          activeDay: data?.stats?.activeDay || "Today",
          classesToday: data?.stats?.classesToday ?? 0,
          conflictAlerts: data?.stats?.conflictAlerts ?? 0,
          unreadNotifications: data?.stats?.unreadNotifications ?? 0,
        });
      } catch (err) {
        console.error(err);
        setStatsError(err.message || "Failed to load dashboard stats.");
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardData();
    fetchStats();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalApproved = events.length;
  const conflicts = events
    .filter((event) => Array.isArray(event.conflicts) && event.conflicts.length > 0)
    .map((event, idx) => ({
      id: event._id || event.id || idx,
      eventName: event.title,
      clashWith: event.conflicts[0],
      timeOverlap: `${event.startTime || "N/A"} - ${event.endTime || "N/A"}`,
      date: event.date ? new Date(event.date).toLocaleDateString() : "TBD",
      severity: event.conflicts.length > 1 ? "high" : "medium",
    }));

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

      {statsLoading && <div className="std-inline-note">Loading dashboard stats...</div>}
      {statsError && <div className="std-inline-error">{statsError}</div>}
      {pageError && <div className="std-inline-error">{pageError}</div>}

        <div className="std-stats-grid">
          <StatsCard value={statsError ? totalApproved : stats.campusEvents} label="Campus Events" color="purple" />
          <StatsCard value={stats.activeDay} label="Active Day"    color="green"  />
          <StatsCard value={statsError ? "-" : stats.classesToday} label="Classes Today" color="orange" />
          <StatsCard value={statsError ? unreadCount : stats.unreadNotifications} label="Unread Alerts" color="blue"  />
        </div>

        {/* Layout Grid */}
      <div className="std-layout">
        
        {/* Main Content Column */}
        <div className="std-main-col">
          
          {/* Conflict Alerts */}
          {conflicts.length > 0 && (
            <section className="std-card std-conflict-section">
              <div className="std-card-header std-conflict-header">
                <div className="std-card-title-wrap">
                  <div className="std-alert-icon">
                    <AlertTriangle size={24} />
                  </div>
                  <h2 className="std-card-title">Action Required: Schedule Conflict</h2>
                </div>
                <Link to="/conflict" className="std-link">Resolve →</Link>
              </div>
              <div className="std-card-body">
                <p className="std-conflict-desc">
                  One or more of your events conflicts with the official academic calendar. Please review.
                </p>
                <div className="std-conflict-list">
                  {conflicts.map((c) => (
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
                <div className="std-skeleton-list" role="status" aria-live="polite" aria-label="Loading events">
                  <div className="app-skeleton std-skeleton-card" />
                  <div className="app-skeleton std-skeleton-card" />
                  <div className="app-skeleton std-skeleton-card" />
                </div>
              ) : events.length === 0 ? (
                <div className="std-empty">
                  <div className="std-empty-icon">
                    <Calendar size={24} />
                  </div>
                  <p>No upcoming events at the moment.</p>
                </div>
              ) : (
                <div className="std-events-list">
                  {events.map((event, index) => {
                    const id = event._id || event.id;
                    return (
                      <EventCard key={id} event={{...event, id}} isAdmin={false} animationIndex={index} />
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
                 <div className="std-skeleton-list std-skeleton-list-notif" role="status" aria-live="polite" aria-label="Loading notifications">
                  <div className="app-skeleton std-skeleton-notif" />
                  <div className="app-skeleton std-skeleton-notif" />
                  <div className="app-skeleton std-skeleton-notif" />
                 </div>
              ) : notifications.length === 0 ? (
                <div className="std-empty">
                  <p>You have no notifications.</p>
                </div>
              ) : (
                <div className="std-notif-list">
                  {notifications.map((n, index) => {
                    const id = n._id || n.id;
                    return (
                      <NotificationItem 
                        key={id} 
                        notification={{...n, id}} 
                        animationIndex={index}
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
                  <div className="std-ql-icon bg-purple">
                    <Calendar size={24} strokeWidth={2} color="white" />
                  </div>
                  <div className="std-ql-text">
                    <span className="std-ql-title">Academic Calendar</span>
                    <span className="std-ql-sub">View classes & exams</span>
                  </div>
                </Link>
                <Link to="/profile" className="std-quick-link">
                  <div className="std-ql-icon bg-blue">
                    <UserIcon size={24} strokeWidth={2} color="white" />
                  </div>
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
