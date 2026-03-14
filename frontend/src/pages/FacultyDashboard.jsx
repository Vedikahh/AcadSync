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
  { id: 2, eventName: "Cultural Night",         severity: "low",  clashWith: "Software Engineering (CSE Sem 5)",          timeOverlap: "14:00 – 15:00", venue: "Open Air Stage",   date: "Dec 5, 2025",  affectedStudents: 60  },
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
    <div className="faculty-dashboard">
      {/* Header */}
      <div className="faculty-header">
        <div>
          <h1 className="faculty-greeting">
            Good{today.getHours() < 12 ? " Morning" : today.getHours() < 17 ? " Afternoon" : " Evening"},{" "}
            {user?.name || "Faculty"}
          </h1>
          <p className="faculty-sub">
            {todayDay}, {today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="faculty-header-actions">
          <Link to="/calendar" className="btn-outline-faculty">View Calendar</Link>
          <Link to="/schedule" className="btn-primary-faculty">My Schedule</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="faculty-stats">
        <StatsCard icon="◈" value={MOCK_LECTURES.length} label="Classes Today"    color="blue"   />
        <StatsCard icon="!" value={totalConflicts}        label="Conflict Alerts"  color="orange" />
        <StatsCard icon="!" value={highConflicts}         label="High Priority"    color="red"    />
        <StatsCard icon="▦" value="3"                    label="Exams This Month" color="purple" />
      </div>

      {/* Tabs */}
      <div className="faculty-tabs">
        {[
          { id: "today",     label: "Today's Classes" },
          { id: "conflicts", label: "Conflict Alerts", count: totalConflicts },
          { id: "events",    label: "Upcoming Events" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`faculty-tab ${activeTab === tab.id ? "faculty-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && <span className="tab-badge">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="faculty-content">
        {activeTab === "today" && (
          <div>
            {MOCK_LECTURES.length === 0 ? (
              <div className="faculty-empty">
                <p>No classes scheduled for today.</p>
              </div>
            ) : (
              <div className="faculty-lecture-list">
                {MOCK_LECTURES.map((lec) => (
                  <LectureCard key={lec.id} lecture={lec} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "conflicts" && (
          <div>
            {MOCK_CONFLICTS.length === 0 ? (
              <div className="faculty-empty">
                <p>No scheduling conflicts found.</p>
              </div>
            ) : (
              <div className="faculty-conflict-list">
                <p className="faculty-conflict-hint">
                  These events may impact your scheduled classes. Review and notify admin if needed.
                </p>
                {MOCK_CONFLICTS.map((c) => (
                  <ConflictCard key={c.id} conflict={c} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "events" && (
          <div className="faculty-events-grid">
            {MOCK_UPCOMING_EVENTS.map((ev) => (
              <EventCard key={ev.id} event={ev} isAdmin={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
