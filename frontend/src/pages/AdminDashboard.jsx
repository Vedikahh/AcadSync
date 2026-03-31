import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAuditLogs, getEvents, getDashboardStats, updateEventStatus } from "../services/api";
import EventCard from "../components/EventCard";
import StatsCard from "../components/StatsCard";
import "./Dashboard.css";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingApprovals: 0,
    approvedEvents: 0,
    activeDepartments: 0,
  });

  useEffect(() => {
    fetchEvents();
    fetchStats();
    fetchAuditLogs();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setEventsError("");
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setEventsError(err.message || "Failed to load events.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError("");
      const data = await getDashboardStats();
      setStats({
        totalStudents: data?.stats?.totalStudents ?? 0,
        pendingApprovals: data?.stats?.pendingApprovals ?? 0,
        approvedEvents: data?.stats?.approvedEvents ?? 0,
        activeDepartments: data?.stats?.activeDepartments ?? 0,
      });
    } catch (err) {
      console.error(err);
      setStatsError(err.message || "Failed to load dashboard stats.");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLogsLoading(true);
      setLogsError("");
      const data = await getAuditLogs({ page: 1, limit: 8 });
      setAuditLogs(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error(err);
      setLogsError(err.message || "Failed to load audit logs.");
      setAuditLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const formatLogAction = (value = "") =>
    String(value)
      .split(".")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");

  const formatLogTime = (value) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "Unknown time";
    return date.toLocaleString();
  };

  const pending  = events.filter((e) => e.status === "pending");
  
  // Calculate dynamic department activity from events
  const deptCounts = events.reduce((acc, event) => {
    const dept = event.department || "General";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});
  
  const DEPT_ACTIVITY = Object.entries(deptCounts).map(([dept, count]) => ({ dept, count })).slice(0, 5);
  const maxCount = Math.max(1, ...DEPT_ACTIVITY.map((d) => d.count));
  const activeDepartmentsCount = statsError ? Object.keys(deptCounts).length : stats.activeDepartments;

  const conflictsList = events
    .filter((e) => e.conflicts && e.conflicts.length > 0)
    .map((e, idx) => ({
      id: e._id || e.id || idx,
      eventId: e._id || e.id,
      event: e.title,
      clashWith: e.conflicts[0], // Show the first clash as summary
      severity: "High"
    }));

  const SYSTEM_LOGS = auditLogs.map((log) => ({
    id: log._id,
    action: formatLogAction(log.action),
    subject: log.target?.label || `${log.target?.entityType || "entity"} ${log.target?.entityId || ""}`.trim(),
    user: log.actor?.id?.name || log.actor?.id?.email || "Unknown actor",
    time: formatLogTime(log.createdAt),
  }));

  const handleApprove = async (id) => {
    try {
      const noteInput = window.prompt("Optional approval note for organizer (leave blank to skip):", "");
      if (noteInput === null) return;

      const updated = await updateEventStatus(
        id,
        "approved",
        noteInput.trim() ? { note: noteInput.trim() } : {}
      );
      setEvents((prev) => prev.map((e) => ((e._id === id || e.id === id) ? updated : e)));
      fetchStats();
    } catch (err) { console.error("Failed to approve", err); }
  };
  const handleReject = async (id) => {
    try {
      const reasonInput = window.prompt("Rejection reason (required):", "");
      if (reasonInput === null) return;

      const rejectionReason = reasonInput.trim();
      if (!rejectionReason) return;

      const noteInput = window.prompt("Optional admin note (additional context):", "");
      if (noteInput === null) return;

      const updated = await updateEventStatus(id, "rejected", {
        rejectionReason,
        ...(noteInput.trim() ? { note: noteInput.trim() } : {}),
      });
      setEvents((prev) => prev.map((e) => ((e._id === id || e.id === id) ? updated : e)));
      fetchStats();
    } catch (err) { console.error("Failed to reject", err); }
  };

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

      {statsLoading && <div className="admin-inline-note">Loading dashboard stats...</div>}
      {statsError && <div className="admin-inline-error">{statsError}</div>}
      {eventsError && <div className="admin-inline-error">{eventsError}</div>}
      {logsError && <div className="admin-inline-error">{logsError}</div>}

        <div className="admin-stats-grid">
          <StatsCard value={stats.totalStudents} label="Total Students"   color="blue"   />
          <StatsCard value={stats.pendingApprovals} label="Needs Approval"   color="orange" />
          <StatsCard value={stats.approvedEvents} label="Approved Events"  color="green"  />
          <StatsCard value={activeDepartmentsCount} label="Active Depts"  color="purple" />
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
              {isLoading ? (
                <div style={{ textAlign: "center", padding: "1rem" }}>Loading events...</div>
              ) : pending.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon">✓</div>
                  <p>Inbox zero. All events have been processed.</p>
                </div>
              ) : (
                <div className="admin-event-list">
                  {pending.map((event) => {
                    const id = event._id || event.id;
                    return (
                      <EventCard 
                        key={id} 
                        event={{ ...event, id }} 
                        user={user}
                        isAdmin 
                        onApprove={() => handleApprove(id)} 
                        onReject={() => handleReject(id)} 
                      />
                    );
                  })}
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
              {DEPT_ACTIVITY.length === 0 ? (
                <div className="admin-empty">
                  <p>No departmental event data available.</p>
                </div>
              ) : (
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
              )}
            </div>
          </section>

          {/* Conflict Reports Table */}
          <section className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title-wrap">
                <h2 className="admin-card-title">Active Conflict Reports</h2>
                {conflictsList.length > 0 && <span className="admin-badge admin-badge-red">{conflictsList.length}</span>}
              </div>
              <Link to="/conflict/resolver" className="admin-link">Resolution center →</Link>
            </div>
            <div className="admin-card-body admin-p-0">
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Proposed Event</th>
                      <th>Clashing With</th>
                      <th>Severity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conflictsList.map((c) => (
                      <tr key={c.id}>
                        <td className="admin-td-primary">{c.event}</td>
                        <td className="admin-td-secondary">{c.clashWith}</td>
                        <td>
                          <span className={`admin-table-pill ${c.severity === "High" ? "pill-red" : "pill-green"}`}>
                            {c.severity}
                          </span>
                        </td>
                        <td>
                          <Link to={c.eventId ? `/conflict/resolver?eventId=${encodeURIComponent(c.eventId)}` : "/conflict/resolver"} className="admin-link">Resolve</Link>
                        </td>
                      </tr>
                    ))}
                    {conflictsList.length === 0 && (
                      <tr>
                        <td colSpan="4" className="admin-td-empty">No active conflicts detected.</td>
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
              {logsLoading ? (
                <div className="admin-empty">
                  <p>Loading system logs...</p>
                </div>
              ) : SYSTEM_LOGS.length === 0 ? (
                <div className="admin-empty">
                  <p>No recent system logs.</p>
                </div>
              ) : (
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
              )}
            </div>
          </section>
          
        </div>
      </div>
    </div>
  );
}
