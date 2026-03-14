import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";
import StatsCard from "../components/StatsCard";
import "./Dashboard.css";

const MOCK_EVENTS = [
  { id: 1, title: "Annual Tech Fest 2025", description: "A two-day celebration of technology and innovation.", date: "2025-11-15", venue: "Main Auditorium", organizer: "CSE Department", status: "pending" },
  { id: 2, title: "Cultural Night", description: "An evening of music, dance, and drama showcasing campus talent.", date: "2025-12-05", venue: "Open Air Stage", organizer: "Cultural Committee", status: "pending" },
  { id: 3, title: "Hackathon 2025", description: "24-hour coding marathon to solve real-world problems.", date: "2025-10-20", venue: "Lab Block C", organizer: "Tech Club", status: "approved" },
  { id: 4, title: "Sports Day", description: "Annual inter-department sports competition.", date: "2025-09-10", venue: "Sports Ground", organizer: "Sports Committee", status: "approved" },
];

const DEPT_ACTIVITY = [
  { dept: "CSE",   count: 8 },
  { dept: "ECE",   count: 5 },
  { dept: "ME",    count: 4 },
  { dept: "MBA",   count: 6 },
  { dept: "Civil", count: 3 },
];
const maxCount = Math.max(...DEPT_ACTIVITY.map((d) => d.count));

const MOCK_CONFLICTS = [
  { event: "Annual Tech Fest 2025", clashWith: "DSA Lecture — CSE Sem 3", dept: "CSE", severity: "High" },
  { event: "Cultural Night", clashWith: "Software Engg Lecture — CSE Sem 5", dept: "CSE", severity: "Low" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState(MOCK_EVENTS);

  const pending  = events.filter((e) => e.status === "pending");
  const approved = events.filter((e) => e.status === "approved");
  const MOCK_STUDENTS    = 428;
  const MOCK_DEPARTMENTS = 8;

  const handleApprove = (id) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "approved" } : e)));
  const handleReject = (id) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "rejected" } : e)));

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-greeting">Admin Panel</h1>
          <p className="dashboard-sub">Welcome, {user?.name}. Manage events and campus activities.</p>
        </div>
        <Link to="/manage-events" className="btn-primary">Manage Events</Link>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <StatsCard icon="◈" value={MOCK_STUDENTS}    label="Students"         color="blue"   />
        <StatsCard icon="…" value={pending.length}   label="Pending Approval" color="orange" />
        <StatsCard icon="✓" value={approved.length}  label="Approved Events"  color="green"  />
        <StatsCard icon="⊞" value={MOCK_DEPARTMENTS} label="Departments"      color="purple" />
      </div>

      {/* Two-column grid */}
      <div className="dashboard-grid">
        {/* Pending Approvals */}
        <div className="dashboard-section">
          <div className="section-title-row">
            <h2>
              Pending Approvals
              {pending.length > 0 && <span className="unread-badge">{pending.length}</span>}
            </h2>
            <Link to="/manage-events" className="view-all-link">View all →</Link>
          </div>
          {pending.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">—</span>
              <p>No pending events. All caught up!</p>
            </div>
          ) : (
            <div className="events-list">
              {pending.map((event) => (
                <EventCard key={event.id} event={event} isAdmin onApprove={handleApprove} onReject={handleReject} />
              ))}
            </div>
          )}
        </div>

        {/* Conflict Reports */}
        <div className="dashboard-section">
          <div className="section-title-row">
            <h2>Conflict Reports</h2>
            <Link to="/conflict" className="view-all-link">Details →</Link>
          </div>
          <div className="conflict-table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Clashes With</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CONFLICTS.map((c, i) => (
                  <tr key={i}>
                    <td className="table-event-name">{c.event}</td>
                    <td className="table-clash">{c.clashWith}</td>
                    <td>
                      <span className={`severity-pill ${c.severity === "High" ? "sev-high" : "sev-low"}`}>
                        {c.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Department Activity chart */}
      <div className="dashboard-section" style={{ maxWidth: "100%", marginTop: "0" }}>
        <div className="section-title-row">
          <h2>Department Activity</h2>
          <span className="view-all-link">Events this semester</span>
        </div>
        <div className="dept-chart">
          {DEPT_ACTIVITY.map((d) => (
            <div key={d.dept} className="dept-bar-group">
              <div className="dept-bar-wrap">
                <div
                  className="dept-bar"
                  style={{ height: `${(d.count / maxCount) * 140}px` }}
                  title={`${d.count} events`}
                />
              </div>
              <span className="dept-bar-label">{d.dept}</span>
              <span className="dept-bar-num">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recently approved */}
      <div className="dashboard-section" style={{ maxWidth: "100%" }}>
        <div className="section-title-row">
          <h2>Recently Approved</h2>
          <Link to="/events" className="view-all-link">View all →</Link>
        </div>
        <div className="events-grid-3">
          {approved.map((event) => (
            <EventCard key={event.id} event={event} isAdmin />
          ))}
        </div>
      </div>
    </div>
  );
}
