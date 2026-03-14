import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./ManageEvents.css";

const INITIAL_EVENTS = [
  { id: 1, title: "Annual Tech Fest 2025", department: "CSE", date: "2025-11-15", venue: "Main Auditorium", organizer: "CSE Dept", participants: 300, status: "pending" },
  { id: 2, title: "Cultural Night", department: "Cultural Committee", date: "2025-12-05", venue: "Open Air Stage", organizer: "Cultural Committee", participants: 500, status: "pending" },
  { id: 3, title: "Hackathon 2025", department: "Tech Club", date: "2025-10-20", venue: "Lab Block C", organizer: "Tech Club", participants: 100, status: "approved" },
  { id: 4, title: "Sports Day", department: "Sports Committee", date: "2025-09-10", venue: "Sports Ground", organizer: "Sports Committee", participants: 600, status: "approved" },
  { id: 5, title: "Alumni Meet 2025", department: "Alumni Cell", date: "2025-12-20", venue: "Conference Hall", organizer: "Alumni Cell", participants: 200, status: "pending" },
  { id: 6, title: "Workshop on AI/ML", department: "CSE", date: "2025-11-02", venue: "Seminar Room", organizer: "IEEE Club", participants: 80, status: "rejected" },
];

const FILTERS = ["all", "pending", "approved", "rejected"];

const STATUS_BADGE = {
  pending:  { cls: "badge-pend", label: "Pending" },
  approved: { cls: "badge-appr", label: "Approved" },
  rejected: { cls: "badge-reje", label: "Rejected" },
};

export default function ManageEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleApprove = (id) => {
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status: "approved" } : e));
    showToast("✅ Event approved successfully!");
  };

  const handleReject = (id) => {
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status: "rejected" } : e));
    showToast("❌ Event rejected.");
  };

  const handleDelete = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast("🗑 Event deleted.");
  };

  const filtered = events.filter((e) => {
    if (filter !== "all" && e.status !== filter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) &&
        !e.department.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: events.length,
    pending: events.filter((e) => e.status === "pending").length,
    approved: events.filter((e) => e.status === "approved").length,
    rejected: events.filter((e) => e.status === "rejected").length,
  };

  return (
    <div className="me-page">
      {/* Toast */}
      {toast && <div className="me-toast">{toast}</div>}

      {/* Header */}
      <div className="me-header">
        <div>
          <h1 className="me-title">📋 Manage Events</h1>
          <p className="me-sub">Review, approve or reject event proposals from students and clubs</p>
        </div>
      </div>

      {/* Controls */}
      <div className="me-controls">
        <input
          className="me-search"
          type="text"
          placeholder="🔍 Search by title or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="me-filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`me-filter-tab ${filter === f ? "me-filter-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {counts[f] !== undefined && <span className="me-tab-count">{counts[f]}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="me-empty">
          <span>📭</span>
          <p>No events match your filter.</p>
        </div>
      ) : (
        <div className="me-table-wrapper">
          <table className="me-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Department</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev) => {
                const badge = STATUS_BADGE[ev.status] || STATUS_BADGE.pending;
                return (
                  <tr key={ev.id} className="me-row">
                    <td>
                      <p className="me-event-name">{ev.title}</p>
                      <span className="me-event-organizer">{ev.organizer}</span>
                    </td>
                    <td className="me-dept">{ev.department}</td>
                    <td className="me-date">
                      {new Date(ev.date + "T00:00").toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="me-venue">{ev.venue}</td>
                    <td className="me-participants">{ev.participants}</td>
                    <td>
                      <span className={`me-badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td>
                      <div className="me-actions">
                        {ev.status !== "approved" && (
                          <button className="me-btn-approve" onClick={() => handleApprove(ev.id)} title="Approve">
                            ✓
                          </button>
                        )}
                        {ev.status !== "rejected" && (
                          <button className="me-btn-reject" onClick={() => handleReject(ev.id)} title="Reject">
                            ✗
                          </button>
                        )}
                        <button className="me-btn-delete" onClick={() => handleDelete(ev.id)} title="Delete">
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
