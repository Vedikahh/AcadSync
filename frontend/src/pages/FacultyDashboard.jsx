import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LectureCard from "../components/LectureCard";
import ConflictCard from "../components/ConflictCard";
import StatsCard from "../components/StatsCard";
import EventCard from "../components/EventCard";
import "./FacultyDashboard.css";

const today = new Date();
const todayDay = today.toLocaleDateString("en-US", { weekday: "long" });

const MOCK_LECTURES = [
  { id: 1, subject: "Data Structures & Algorithms", faculty: "Dr. Ramesh Kumar", department: "CSE", room: "A-201", startTime: "09:00", endTime: "10:00", day: todayDay, type: "lecture" },
  { id: 2, subject: "Database Management Systems",   faculty: "Dr. Ramesh Kumar", department: "CSE", room: "Lab-B3", startTime: "11:00", endTime: "12:30", day: todayDay, type: "lab" },
  { id: 3, subject: "Software Engineering",          faculty: "Dr. Ramesh Kumar", department: "CSE", room: "A-205", startTime: "14:00", endTime: "15:00", day: todayDay, type: "lecture" },
];

const MOCK_CONFLICTS = [
  { id: 1, eventName: "Annual Tech Fest 2025", severity: "high", clashWith: "Data Structures & Algorithms (CSE Sem 3)", timeOverlap: "09:00 – 10:00", venue: "Main Auditorium", date: "Nov 15, 2025", affectedStudents: 120 },
  { id: 2, eventName: "Cultural Night",         severity: "medium",  clashWith: "Software Engineering (CSE Sem 5)",          timeOverlap: "14:00 – 15:00", venue: "Open Air Stage",   date: "Dec 5, 2025",  affectedStudents: 60  },
];

const MOCK_UPCOMING_EVENTS = [
  { id: 1, title: "Annual Tech Fest 2025", description: "Two-day celebration of technology, innovation, and creativity.", date: "2025-11-15", venue: "Main Auditorium", organizer: "CSE Department",  status: "approved" },
  { id: 2, title: "End-Semester Exams",   description: "CSE semester 5 exams covering all theory subjects.",           date: "2025-11-20", venue: "Exam Hall A & B", organizer: "Exam Cell",          status: "approved" },
];

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("today");
  const totalConflicts = MOCK_CONFLICTS.length;
  const highConflicts  = MOCK_CONFLICTS.filter((c) => c.severity === "high").length;

  return (
    <div className="faculty-db-page">
      {/* Header */}
      <div className="faculty-db-header">
        <div className="faculty-db-greeting">
          <h1 className="faculty-db-title">
            Good{today.getHours() < 12 ? " Morning" : today.getHours() < 17 ? " Afternoon" : " Evening"},{" "}
            {user?.name || "Faculty Member"}
          </h1>
          <p className="faculty-db-sub">
            {todayDay}, {today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="faculty-db-actions">
          <Link to="/calendar" className="fac-btn fac-btn-outline">
            <span className="fac-btn-icon">▦</span> View Calendar
          </Link>
          <Link to="/schedule" className="fac-btn fac-btn-primary">
            <span className="fac-btn-icon">☰</span> My Schedule
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="faculty-stats-grid">
        <StatsCard icon="◈" value={MOCK_LECTURES.length} label="Classes Today"    color="blue"   />
        <StatsCard icon="!" value={totalConflicts}        label="Conflict Alerts"  color="orange" />
        <StatsCard icon="!" value={highConflicts}         label="High Priority"    color="red"    />
        <StatsCard icon="▦" value="3"                    label="Exams This Month" color="purple" />
      </div>

      {/* Main Content Layout */}
      <div className="faculty-content-layout">
        
        {/* Left column (Tabs & Timeline) */}
        <div className="faculty-main-col">
          <div className="faculty-tabs-wrapper">
            <div className="faculty-tabs">
              {[
                { id: "today",     label: "Today's Schedule" },
                { id: "conflicts", label: "Action Needed", count: totalConflicts },
                { id: "events",    label: "Upcoming Events" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`faculty-tab ${activeTab === tab.id ? "faculty-tab-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {tab.count > 0 && <span className="fac-tab-badge">{tab.count}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="faculty-panel-area">
            {activeTab === "today" && (
              <div className="fac-panel fac-panel-today">
                {MOCK_LECTURES.length === 0 ? (
                  <div className="fac-empty-state">
                    <div className="fac-empty-icon">—</div>
                    <p>No classes scheduled for today. Enjoy your free time!</p>
                  </div>
                ) : (
                  <div className="fac-timeline">
                    {MOCK_LECTURES.map((lec) => (
                      <div key={lec.id} className="fac-timeline-item">
                        <div className="fac-timebox">
                          <span className="fac-time">{lec.startTime}</span>
                        </div>
                        <div className="fac-card-wrapper">
                          <LectureCard lecture={lec} />
                        </div>
                      </div>
                    ))}
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
                <div className="fac-events-grid">
                  {MOCK_UPCOMING_EVENTS.map((ev) => (
                    <EventCard key={ev.id} event={ev} isAdmin={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column (Notice board / Quick Links) */}
        <div className="faculty-side-col">
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
                <p>Mid-term grade submissions are due by Nov 25th.</p>
              </li>
              <li>
                <span className="fac-news-dot sync-green"></span>
                <p>New projector installed in Lab-B3.</p>
              </li>
              <li>
                <span className="fac-news-dot sync-orange"></span>
                <p>Faculty meeting scheduled for Friday at 3 PM.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
