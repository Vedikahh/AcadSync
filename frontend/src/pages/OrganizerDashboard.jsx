import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSchedules, getEvents, getMyEvents } from "../services/api";
import { formatTime12h } from "../utils/formatTime";
import { formatEventDate, DATE_FALLBACK_TEXT } from "../utils/formatDate";
import LectureCard from "../components/LectureCard";
import ConflictCard from "../components/ConflictCard";
import StatsCard from "../components/StatsCard";
import EventCard from "../components/EventCard";
import "./OrganizerDashboard.css";

const today = new Date();
const todayDay = today.toLocaleDateString("en-US", { weekday: "long" });

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("today");
  
  const [allLectures, setAllLectures] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setPageError("");

      const [schedResult, eventsResult, myEventsResult] = await Promise.allSettled([
        getSchedules(),
        getEvents(),
        getMyEvents(),
      ]);

      if (schedResult.status === "fulfilled") {
        const allSchedules = Array.isArray(schedResult.value) ? schedResult.value : [];
        setAllLectures(allSchedules);
        const todaysLectures = allSchedules.filter((lecture) => lecture.day === todayDay);
        setLectures(todaysLectures);
      } else {
        setAllLectures([]);
        setLectures([]);
        setPageError(schedResult.reason?.message || "Failed to load schedule.");
      }

      if (eventsResult.status === "fulfilled") {
        const allEvents = Array.isArray(eventsResult.value) ? eventsResult.value : [];
        const upcomingEvents = allEvents.filter((event) => event.status === "approved");
        setEvents(upcomingEvents);
      } else {
        setEvents([]);
        setPageError((prev) => prev || eventsResult.reason?.message || "Failed to load events.");
      }

      if (myEventsResult.status === "fulfilled") {
        const userEvents = Array.isArray(myEventsResult.value) ? myEventsResult.value : [];
        setMyEvents(userEvents);
      } else {
        setMyEvents([]);
        setPageError((prev) => prev || myEventsResult.reason?.message || "Failed to load your events.");
      }

      setIsLoading(false);
    };

    fetchDashboardData();
  }, [user]);

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const endOfThisMonth = useMemo(() => {
    const d = new Date(startOfToday);
    d.setMonth(d.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [startOfToday]);

  const conflictItems = useMemo(
    () => myEvents
      .filter((event) => Array.isArray(event.conflicts) && event.conflicts.length > 0)
      .map((event, idx) => ({
        id: event._id || event.id || idx,
        eventName: event.title,
        clashWith: event.conflicts[0],
        timeOverlap: `${event.startTime || "N/A"} - ${event.endTime || "N/A"}`,
        date: formatEventDate(event.date, { fallback: DATE_FALLBACK_TEXT }),
        severity: event.conflicts.length > 1 ? "high" : "medium",
      })),
    [myEvents]
  );

  const pendingRequests = useMemo(
    () => myEvents.filter((event) => event.status === "pending").length,
    [myEvents]
  );

  const upcomingMyEvents = useMemo(
    () => myEvents.filter((event) => event.status === "approved" && event.date && new Date(event.date) >= startOfToday).length,
    [myEvents, startOfToday]
  );

  const examsThisMonth = useMemo(
    () => myEvents.filter((event) => event.type === "exam" && event.date && new Date(event.date) >= startOfToday && new Date(event.date) <= endOfThisMonth).length,
    [myEvents, startOfToday, endOfThisMonth]
  );

  const weekDayNames = useMemo(() => {
    const names = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(startOfToday);
      d.setDate(startOfToday.getDate() + i);
      names.push(d.toLocaleDateString("en-US", { weekday: "long" }));
    }
    return names;
  }, [startOfToday]);

  const thisWeekSessions = useMemo(
    () => allLectures.filter((lecture) => weekDayNames.includes(lecture.day)).length,
    [allLectures, weekDayNames]
  );

  const nextUpcomingEvent = useMemo(() => {
    const candidates = myEvents
      .filter((event) => event.date && new Date(event.date) >= startOfToday)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return candidates[0] || null;
  }, [myEvents, startOfToday]);

  const totalConflicts = conflictItems.length;
  const highConflicts = conflictItems.filter((conflict) => conflict.severity === "high").length;

  const classesTodayValue = lectures.length === 0 ? "Free Day" : lectures.length;
  const pendingRequestsValue = pendingRequests === 0 ? "Clear" : pendingRequests;
  const upcomingEventsValue = upcomingMyEvents === 0 ? "Plan" : upcomingMyEvents;
  const examsThisMonthValue = examsThisMonth === 0 ? "No Exams" : examsThisMonth;

  return (
    <div className="organizer-db-page">
      {/* Header */}
      <div className="organizer-db-header">
        <div className="organizer-db-greeting">
          <h1 className="organizer-db-title">
            Good{today.getHours() < 12 ? " Morning" : today.getHours() < 17 ? " Afternoon" : " Evening"},{" "}
            {user?.name || "organizer Member"}
          </h1>
          <p className="organizer-db-sub">
            {todayDay}, {today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="organizer-db-actions">
          <Link to="/calendar" className="fac-btn fac-btn-outline">
            <span className="fac-btn-icon">▦</span> View Calendar
          </Link>
          <Link to="/schedule" className="fac-btn fac-btn-primary">
            <span className="fac-btn-icon">☰</span> My Schedule
          </Link>
        </div>
      </div>

      {pageError && <div className="organizer-inline-error">{pageError}</div>}

        <div className="organizer-stats-grid">
          <StatsCard value={classesTodayValue}    label="Classes Today"    color="blue"   />
          <StatsCard value={pendingRequestsValue} label="Pending Requests" color="orange" />
          <StatsCard value={upcomingEventsValue}  label="Upcoming Events"  color="red"    />
          <StatsCard value={examsThisMonthValue}  label="Exams This Month" color="purple" />
        </div>

        <div className="organizer-snapshot-row">
          <div className="organizer-snapshot-pill">
            <span className="organizer-snapshot-k">Weekly Sessions</span>
            <strong className="organizer-snapshot-v">{thisWeekSessions}</strong>
          </div>
          <div className="organizer-snapshot-pill">
            <span className="organizer-snapshot-k">Conflict Alerts</span>
            <strong className="organizer-snapshot-v">{totalConflicts} total / {highConflicts} high</strong>
          </div>
          <div className="organizer-snapshot-pill">
            <span className="organizer-snapshot-k">Next Event</span>
            <strong className="organizer-snapshot-v">
              {nextUpcomingEvent
                ? `${nextUpcomingEvent.title || "Event"} on ${formatEventDate(nextUpcomingEvent.date, { fallback: DATE_FALLBACK_TEXT })}`
                : "No upcoming events"}
            </strong>
          </div>
        </div>

        {/* Main Content Layout */}
      <div className="organizer-content-layout">
        
        {/* Left column (Tabs & Timeline) */}
        <div className="organizer-main-col">
          <div className="organizer-tabs-wrapper">
            <div className="organizer-tabs">
              {[
                { id: "today",     label: "Today's Schedule" },
                { id: "conflicts", label: "Action Needed", count: totalConflicts },
                { id: "events",    label: "Upcoming Events" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`organizer-tab ${activeTab === tab.id ? "organizer-tab-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {tab.count > 0 && <span className="fac-tab-badge">{tab.count}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="organizer-panel-area">
            {activeTab === "today" && (
              <div className="fac-panel fac-panel-today">
                {isLoading ? (
                  <div style={{ padding: "2rem", textAlign: "center" }}>Loading schedule...</div>
                ) : lectures.length === 0 ? (
                  <div className="fac-empty-state">
                    <div className="fac-empty-icon">—</div>
                    <p>No classes scheduled for today. Enjoy your free time!</p>
                  </div>
                ) : (
                  <div className="fac-timeline">
                    {lectures.map((lec) => {
                      const id = lec._id || lec.id;
                      return (
                        <div key={id} className="fac-timeline-item">
                          <div className="fac-timebox">
                            <span className="fac-time">{formatTime12h(lec.startTime)}</span>
                          </div>
                          <div className="fac-card-wrapper">
                            <LectureCard lecture={{...lec, id}} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "conflicts" && (
              <div className="fac-panel fac-panel-conflicts">
                {conflictItems.length === 0 ? (
                  <div className="fac-empty-state">
                    <div className="fac-empty-icon">✓</div>
                    <p>Your schedule is clear. No conflicts detected.</p>
                  </div>
                ) : (
                  <div className="fac-conflict-list">
                    <div className="fac-alert-banner">
                      <span className="fac-alert-icon">!</span>
                      <div className="fac-alert-text">
                        <strong>Review Required:</strong> The following upcoming events conflict with your regular classes. You may need to reschedule.
                      </div>
                    </div>
                    {conflictItems.map((c) => (
                      <ConflictCard key={c.id} conflict={c} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "events" && (
              <div className="fac-panel fac-panel-events">
                 {isLoading ? (
                  <div style={{ padding: "2rem", textAlign: "center" }}>Loading events...</div>
                ) : events.length === 0 ? (
                  <div className="fac-empty-state">
                    <p>No upcoming events.</p>
                  </div>
                ) : (
                  <div className="fac-events-grid">
                    {events.map((ev) => {
                      const id = ev._id || ev.id;
                      return (
                        <EventCard key={id} event={{...ev, id}} user={user} isAdmin={false} />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column (Notice board / Quick Links) */}
        <div className="organizer-side-col">
          <div className="fac-side-card">
            <h3 className="fac-side-title">Quick Actions</h3>
            <div className="fac-quick-links">
              <Link to="/create-event" className="fac-link-item">
                <span className="fac-link-icon">+</span>
                <span>Request New Event</span>
              </Link>
              <Link to="/events" className="fac-link-item">
                <span className="fac-link-icon">◈</span>
                <span>Browse All Events</span>
              </Link>
              <Link to="/notifications" className="fac-link-item">
                <span className="fac-link-icon">◉</span>
                <span>View Announcements</span>
              </Link>
            </div>
          </div>

          <div className="fac-side-card fac-notice-card">
            <h3 className="fac-side-title">Recent Updates</h3>
            <ul className="fac-news-list">
              <li>
                <span className="fac-news-dot sync-blue"></span>
                <p>Ensure class completion checks are marked in portal.</p>
              </li>
              <li>
                <span className="fac-news-dot sync-green"></span>
                <p>You have zero unread notifications.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
