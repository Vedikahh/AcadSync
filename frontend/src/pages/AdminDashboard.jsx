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

const MOCK_CONFLICTS = [
  { id: 101, event: "Annual Tech Fest 2025", clashWith: "DSA Lecture — CSE Sem 3", dept: "CSE", severity: "High" },
  { id: 102, event: "Cultural Night", clashWith: "Software Engg Lecture — CSE Sem 5", dept: "CSE", severity: "Low" },
];

const SYSTEM_LOGS = [
  { id: 1, action: "Approved event", subject: "Hackathon 2025", time: "2h ago", user: "Admin (You)" },
  { id: 2, action: "Rejected event", subject: "Night DJ Party", time: "5h ago", user: "Admin (You)" },
  { id: 3, action: "System Backup", subject: "Database Snapshot", time: "1d ago", user: "System" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState(MOCK_EVENTS);

  const pending  = events.filter((e) => e.status === "pending");
  const approved = events.filter((e) => e.status === "approved");
  const MOCK_STUDENTS    = 428;
  const MOCK_DEPARTMENTS = 8;
  const maxCount = Math.max(...DEPT_ACTIVITY.map((d) => d.count));

  const handleApprove = (id) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "approved" } : e)));
  const handleReject = (id) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "rejected" } : e)));

  return (
    <div className="admin-db-page">
      {/* ── Header ── */}
      <div className="admin-header">
        <div className="admin-greeting-box">
          <h1 className="admin-title">Admin Overview</h1>
          <p className="admin-subtitle">Welcome back, {user?.name || "Administrator"}. Here is what's happening today.</p>
        </div>
        <div className="admin-actions">
          <Link to="/manage-events" className="admin-btn-primary">
            <span className="admin-btn-icon">+</span> Manage All Events
          </Link>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="admin-stats-grid">
        <StatsCard icon="◈" value={MOCK_STUDENTS}    label="Total Students"   color="blue"   />
        <StatsCard icon="…" value={pending.length}   label="Needs Approval"   color="orange" />
        <StatsCard icon="✓" value={approved.length}  label="Approved Events"  color="green"  />
        <StatsCard icon="⊞" value={MOCK_DEPARTMENTS} label="Active Depts"     color="purple" />
      </div>

      {/* ── Main Layout ── */}
      <div className="admin-layout">
        
        {/* Left Column (Primary Content) */}
        <div className="admin-main-col">
          
          {/* Pending Events */}
          <section className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title-wrap">
                <h2 className="admin-card-title">Pending Approvals</h2>
                {pending.length > 0 && <span className="admin-badge admin-badge-orange">{pending.length}</span>}
              </div>
              <Link to="/manage-events" className="admin-link">View all queue →</Link>
            </div>
            
            <div className="admin-card-body">
              {pending.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">✓</div>
                  <p>Inbox zero. All events have been processed.</p>
                </div>
              ) : (
                <div className="admin-event-list">
                  {pending.map((event) => (
                    <EventCard key={event.id} event={event} isAdmin onApprove={handleApprove} onReject={handleReject} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Department Activity Graph */}
          <section className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Event Activity by Department</h2>
              <span className="admin-metric-label">This Semester</span>
            </div>
            <div className="admin-card-body">
              <div className="admin-chart-container">
                {DEPT_ACTIVITY.map((d) => {
                  const percent = Math.max(10, Math.round((d.count / maxCount) * 100));
                  return (
                    <div key={d.dept} className="admin-chart-bar-group">
                      <div className="admin-chart-bar-wrap">
                        <div className="admin-chart-bar" style={{ height: `${percent}%` }}>
                          <span className="admin-chart-tooltip">{d.count} Events</span>
                        </div>
                      </div>
                      <span className="admin-chart-label">{d.dept}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Conflict Reports Table */}
          <section className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title-wrap">
                <h2 className="admin-card-title">Active Conflict Reports</h2>
                {MOCK_CONFLICTS.length > 0 && <span className="admin-badge admin-badge-red">{MOCK_CONFLICTS.length}</span>}
              </div>
              <Link to="/conflict" className="admin-link">Resolution center →</Link>
            </div>
            <div className="admin-card-body admin-p-0">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Proposed Event</th>
                      <th>Clashing With</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_CONFLICTS.map((c) => (
                      <tr key={c.id}>
                        <td className="admin-td-primary">{c.event}</td>
                        <td className="admin-td-secondary">{c.clashWith}</td>
                        <td>
                          <span className={`admin-table-pill ${c.severity === "High" ? "pill-red" : "pill-green"}`}>
                            {c.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {MOCK_CONFLICTS.length === 0 && (
                      <tr>
                        <td colSpan="3" className="admin-td-empty">No active conflicts detected.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          
        </div>

        {/* Right Column (Secondary Content) */}
        <div className="admin-side-col">
          
          {/* Quick Actions */}
          <section className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Command Center</h2>
            </div>
            <div className="admin-card-body">
              <div className="admin-action-grid">
                <Link to="/manage-events" className="admin-action-btn">
                  <div className="admin-action-icon bg-blue">≡</div>
                  <span>Event Queue</span>
                </Link>
                <Link to="/schedule" className="admin-action-btn">
                  <div className="admin-action-icon bg-purple">▦</div>
                  <span>Master Schedule</span>
                </Link>
                <Link to="/conflict" className="admin-action-btn">
                  <div className="admin-action-icon bg-red">!</div>
                  <span>Conflicts</span>
                </Link>
                <Link to="/notifications" className="admin-action-btn">
                  <div className="admin-action-icon bg-green">◉</div>
                  <span>Broadcast</span>
                </Link>
              </div>
            </div>
          </section>

          {/* System Logs */}
          <section className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">System Logs</h2>
            </div>
            <div className="admin-card-body">
              <div className="admin-logs">
                {SYSTEM_LOGS.map((log) => (
                  <div key={log.id} className="admin-log-item">
                    <div className="admin-log-indicator" />
                    <div className="admin-log-content">
                      <p className="admin-log-main">
                        <span className="admin-log-bold">{log.action}:</span> {log.subject}
                      </p>
                      <p className="admin-log-meta">{log.user} • {log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          
        </div>
      </div>
    </div>
  );
}
