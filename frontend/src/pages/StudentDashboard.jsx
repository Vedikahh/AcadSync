import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Calendar, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getEvents, getNotifications, markNotificationRead } from "../services/api";
import EventCard from "../components/EventCard";
import NotificationItem from "../components/NotificationItem";
import StatsCard from "../components/StatsCard";
import { formatEventDate, DATE_FALLBACK_TEXT } from "../utils/formatDate";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setPageError("");

      const [eventsResult, notifsResult] = await Promise.allSettled([
        getEvents(),
        getNotifications(),
      ]);

      if (eventsResult.status === "fulfilled") {
        const approvedAndNonConflictingEventsList = Array.isArray(eventsResult.value)
          ? eventsResult.value.filter((event) => {
              // Show only approved events with no conflicts
              const hasNoConflicts = !Array.isArray(event.conflicts) || event.conflicts.length === 0;
              return event.status === "approved" && hasNoConflicts;
            })
          : [];
        setEvents(approvedAndNonConflictingEventsList);
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

    fetchDashboardData();
  }, [user]);

  // Get today's date in YYYY-MM-DD format for comparison
  const todayDate = new Date().toISOString().split('T')[0];
  
  // Filter today's events and lectures
  const todayEvents = events.filter(event => {
    const eventDate = event.date ? new Date(event.date).toISOString().split('T')[0] : null;
    return eventDate === todayDate;
  });

  const todayLectures = todayEvents.filter(event => event.type === 'lecture');
  const todayOtherEvents = todayEvents.filter(event => event.type !== 'lecture');
  
  // Upcoming events (excluding today)
  const upcomingEvents = events.filter(event => {
    const eventDate = event.date ? new Date(event.date).toISOString().split('T')[0] : null;
    return eventDate && eventDate > todayDate;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalApproved = events.length;

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long" }),
    []
  );

  const startOfToday = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const weekAhead = useMemo(() => {
    const date = new Date(startOfToday);
    date.setDate(date.getDate() + 7);
    date.setHours(23, 59, 59, 999);
    return date;
  }, [startOfToday]);

  const endOfThisMonth = useMemo(() => {
    const date = new Date(startOfToday);
    date.setMonth(date.getMonth() + 1, 0);
    date.setHours(23, 59, 59, 999);
    return date;
  }, [startOfToday]);

  const upcomingThisWeek = useMemo(
    () => events.filter((event) => event.date && new Date(event.date) >= startOfToday && new Date(event.date) <= weekAhead).length,
    [events, startOfToday, weekAhead]
  );

  const examsThisMonth = useMemo(
    () => events.filter((event) => event.type === "exam" && event.date && new Date(event.date) >= startOfToday && new Date(event.date) <= endOfThisMonth).length,
    [events, startOfToday, endOfThisMonth]
  );

  const nextEvent = useMemo(() => {
    const candidates = events
      .filter((event) => event.date && new Date(event.date) >= startOfToday)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return candidates[0] || null;
  }, [events, startOfToday]);

  const campusEventsValue = totalApproved === 0 ? "No Events" : totalApproved;
  const classesTodayValue = todayLectures.length === 0 ? "No Classes" : todayLectures.length;
  const unreadAlertsValue = unreadCount === 0 ? "All Read" : unreadCount;

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

      {pageError && <div className="std-inline-error">{pageError}</div>}

        <div className="std-stats-grid">
          <StatsCard value={campusEventsValue} label="Campus Events" color="purple" />
          <StatsCard value={todayLabel} label="Active Day" color="green" />
          <StatsCard value={classesTodayValue} label="Classes Today" color="orange" />
          <StatsCard value={unreadAlertsValue} label="Unread Alerts" color="blue" />
        </div>

        <div className="std-snapshot-row">
          <div className="std-snapshot-pill">
            <span className="std-snapshot-k">This Week</span>
            <strong className="std-snapshot-v">{upcomingThisWeek} upcoming events</strong>
          </div>
          <div className="std-snapshot-pill">
            <span className="std-snapshot-k">Exams This Month</span>
            <strong className="std-snapshot-v">{examsThisMonth === 0 ? "No exams scheduled" : `${examsThisMonth} exam events`}</strong>
          </div>
          <div className="std-snapshot-pill">
            <span className="std-snapshot-k">Next Event</span>
            <strong className="std-snapshot-v">
              {nextEvent
                ? `${nextEvent.title || "Event"} on ${formatEventDate(nextEvent.date, { fallback: DATE_FALLBACK_TEXT })}`
                : "No upcoming events"}
            </strong>
          </div>
        </div>

        {/* Layout Grid */}
      <div className="std-layout">
        
        {/* Main Content Column */}
        <div className="std-main-col">
          
          {/* Today's Schedule Section */}
          {(todayLectures.length > 0 || todayOtherEvents.length > 0) && (
            <section className="std-card std-today-section">
              <div className="std-card-header">
                <div className="std-card-title-wrap">
                  <Calendar size={24} style={{ color: '#7c3aed' }} />
                  <h2 className="std-card-title">Today's Schedule</h2>
                  <div className="std-badge std-badge-purple">{todayEvents.length} Items</div>
                </div>
              </div>
              <div className="std-card-body std-bg-gray">
                {/* Today's Lectures */}
                {todayLectures.length > 0 && (
                  <div className="std-schedule-group">
                    <h3 className="std-schedule-group-title">📚 Lectures</h3>
                    <div className="std-events-list">
                      {todayLectures.map((event, index) => {
                        const id = event._id || event.id;
                        return (
                          <EventCard key={id} event={{...event, id}} isAdmin={false} animationIndex={index} />
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Today's Other Events */}
                {todayOtherEvents.length > 0 && (
                  <div className="std-schedule-group">
                    <h3 className="std-schedule-group-title">🎯 Events</h3>
                    <div className="std-events-list">
                      {todayOtherEvents.map((event, index) => {
                        const id = event._id || event.id;
                        return (
                          <EventCard key={id} event={{...event, id}} isAdmin={false} animationIndex={index} />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Upcoming Events Section */}
          <section className="std-card">
            <div className="std-card-header">
              <div className="std-card-title-wrap">
                <h2 className="std-card-title">Upcoming Events</h2>
                <div className="std-badge std-badge-purple">{upcomingEvents.length} Upcoming</div>
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
              ) : upcomingEvents.length === 0 ? (
                <div className="std-empty">
                  <div className="std-empty-icon">
                    <Calendar size={24} />
                  </div>
                  <p>No upcoming events scheduled.</p>
                </div>
              ) : (
                <div className="std-events-list">
                  {upcomingEvents.map((event, index) => {
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
