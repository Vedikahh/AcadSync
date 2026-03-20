import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSchedules, getEvents } from "../services/api";
import { formatTime12h } from "../utils/formatTime";
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
  
  const [lectures, setLectures] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSchedules().catch(() => []),
      getEvents().catch(() => [])
    ]).then(([schedData, eventsData]) => {
      const allSchedules = Array.isArray(schedData) ? schedData : [];
      // Filter schedules to only show today's classes for the organizer (if backend doesn't filter by user, we can optionally filter by organizer name)
      // For now, let's filter purely by today's day of week.
      const todaysLectures = allSchedules.filter(l => l.day === todayDay);
      setLectures(todaysLectures);

      const allEvents = Array.isArray(eventsData) ? eventsData : [];
      // Filter upcoming approved events
      const upcomingEvents = allEvents.filter(e => e.status === "approved");
      setEvents(upcomingEvents);

      setIsLoading(false);
    });
  }, [user]);

  const MOCK_CONFLICTS = []; // Empty out dummy conflicts
  const totalConflicts = MOCK_CONFLICTS.length;
  const highConflicts  = MOCK_CONFLICTS.filter((c) => c.severity === "high").length;

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

    
        <div className="organizer-stats-grid">
          <StatsCard value={lectures.length}       label="Classes Today"    color="blue"   />
          <StatsCard value={totalConflicts}        label="Conflict Alerts"  color="orange" />
          <StatsCard value={highConflicts}         label="High Priority"    color="red"    />
          <StatsCard value="0"                     label="Exams This Month" color="purple" />
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
                {MOCK_CONFLICTS.length === 0 ? (
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
                    {MOCK_CONFLICTS.map((c) => (
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
