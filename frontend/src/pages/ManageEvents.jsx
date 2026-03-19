import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getEvents, updateEventStatus, deleteEvent } from "../services/api";
import EventModal from "../components/EventModal";
import "./ManageEvents.css";

const FILTERS = ["all", "pending", "approved", "rejected"];

const STATUS_BADGE = {
  pending:  { cls: "badge-pend", label: "Pending" },
  approved: { cls: "badge-appr", label: "Approved" },
  rejected: { cls: "badge-reje", label: "Rejected" },
};

export default function ManageEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load events", err);
      showToast("❌ Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleApprove = async (id) => {
    try {
      await updateEventStatus(id, "approved");
      setEvents((prev) => prev.map((e) => (e._id === id || e.id === id) ? { ...e, status: "approved" } : e));
      showToast("✅ Event approved successfully!");
    } catch (err) {
      showToast("❌ Failed to approve event");
    }
  };

  const handleReject = async (id) => {
    try {
      await updateEventStatus(id, "rejected");
      setEvents((prev) => prev.map((e) => (e._id === id || e.id === id) ? { ...e, status: "rejected" } : e));
      showToast("❌ Event rejected.");
    } catch (err) {
      showToast("❌ Failed to reject event");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e._id !== id && e.id !== id));
      showToast("🗑 Event deleted.");
    } catch (err) {
      showToast("❌ Failed to delete event");
    }
  };

  const filtered = events.filter((e) => {
    if (filter !== "all" && e.status !== filter) return false;
    // ensure title and department exist before toLowerCase
    const titleMatch = e.title && e.title.toLowerCase().includes(search.toLowerCase());
    const deptMatch = e.department && e.department.toLowerCase().includes(search.toLowerCase());
    if (search && !(titleMatch || deptMatch)) return false;
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
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading events...</div>
      ) : filtered.length === 0 ? (
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
                const id = ev._id || ev.id;
                return (
                  <tr key={id} className="me-row" onClick={() => setSelectedEvent(ev)} style={{ cursor: "pointer" }}>
                    <td>
                      <p className="me-event-name">{ev.title}</p>
                      <span className="me-event-organizer">{ev.organizer || (ev.createdBy && ev.createdBy.name) || "Unknown"}</span>
                    </td>
                    <td className="me-dept">{ev.department}</td>
                    <td className="me-date">
                      {ev.date ? new Date(ev.date + "T00:00").toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      }) : "TBA"}
                    </td>
                    <td className="me-venue">{ev.venue}</td>
                    <td className="me-participants">{ev.participants || "--"}</td>
                    <td>
                      <span className={`me-badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="me-actions">
                        {ev.status !== "approved" && (
                          <button className="me-btn-approve" onClick={() => handleApprove(id)} title="Approve">
                            ✓
                          </button>
                        )}
                        {ev.status !== "rejected" && (
                          <button className="me-btn-reject" onClick={() => handleReject(id)} title="Reject">
                            ✗
                          </button>
                        )}
                        <button className="me-btn-delete" onClick={() => handleDelete(id)} title="Delete">
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

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
