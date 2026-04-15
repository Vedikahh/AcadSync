import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents, updateEventStatus, deleteEvent } from "../services/api";
import socket from "../services/socket";
import { formatEventDate, DATE_FALLBACK_TEXT } from "../utils/formatDate";
import "./ManageEvents.css";

const FILTERS = ["all", "pending", "approved", "rejected"];

const STATUS_BADGE = {
  pending:  { cls: "badge-pend", label: "Pending" },
  approved: { cls: "badge-appr", label: "Approved" },
  rejected: { cls: "badge-reje", label: "Rejected" },
};

export default function ManageEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();

    socket.on('calendarUpdate', fetchEvents);
    return () => { socket.off('calendarUpdate', fetchEvents); };
  }, []);


  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getEvents({ limit: 100, offset: 0, sort: "-createdAt" });
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load events", err);
      setError("Failed to load events. Please retry.");
      showToast("❌ Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const openEventDetails = (event) => {
    const id = event?._id || event?.id;
    if (!id) {
      showToast("⚠ Unable to open this event right now.");
      return;
    }

    navigate(`/events/${id}`, { state: { event, fromManageEvents: true } });
  };

  const handleApprove = async (id) => {
    try {
      const noteInput = window.prompt("Optional approval note for organizer (leave blank to skip):", "");
      if (noteInput === null) return;

      const payload = noteInput.trim() ? { note: noteInput.trim() } : {};
      const updated = await updateEventStatus(id, "approved", payload);
      setEvents((prev) => prev.map((e) => (e._id === id || e.id === id) ? updated : e));
      showToast("✅ Event approved successfully!");
    } catch {
      showToast("❌ Failed to approve event");
    }
  };

  const handleReject = async (id) => {
    try {
      const reasonInput = window.prompt("Rejection reason (required):", "");
      if (reasonInput === null) return;

      const rejectionReason = reasonInput.trim();
      if (!rejectionReason) {
        showToast("⚠ Rejection reason is required.");
        return;
      }

      const noteInput = window.prompt("Optional admin note (additional context):", "");
      if (noteInput === null) return;

      const payload = {
        rejectionReason,
        ...(noteInput.trim() ? { note: noteInput.trim() } : {}),
      };

      const updated = await updateEventStatus(id, "rejected", payload);
      setEvents((prev) => prev.map((e) => (e._id === id || e.id === id) ? updated : e));
      showToast("❌ Event rejected.");
    } catch (err) {
      showToast(`❌ ${err.message || "Failed to reject event"}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e._id !== id && e.id !== id));
      showToast("🗑 Event deleted.");
    } catch {
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
      {toast && <div className="me-toast" role="status" aria-live="polite">{toast}</div>}

      {/* Header */}
      <div className="me-header">
        <div>
          <h1 className="me-title"> Manage Events</h1>
          <p className="me-sub">Review, approve or reject event proposals from students and clubs</p>
        </div>
      </div>

      {/* Controls */}
      <div className="me-controls">
        <label htmlFor="manage-events-search" className="me-sr-only">Search events</label>
        <input
          id="manage-events-search"
          className="me-search"
          type="text"
          placeholder=" Search by title or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search by event title or department"
        />
        <div className="me-filter-tabs" role="tablist" aria-label="Filter events by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`me-filter-tab ${filter === f ? "me-filter-active" : ""}`}
              onClick={() => setFilter(f)}
              role="tab"
              aria-selected={filter === f}
              aria-controls="manage-events-table"
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {counts[f] !== undefined && <span className="me-tab-count">{counts[f]}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="me-skeleton-wrap" role="status" aria-live="polite" aria-label="Loading events">
          <div className="app-skeleton me-skeleton-row" />
          <div className="app-skeleton me-skeleton-row" />
          <div className="app-skeleton me-skeleton-row" />
          <div className="app-skeleton me-skeleton-row" />
        </div>
      ) : error ? (
        <div className="me-state me-state-error" role="alert">
          <p>{error}</p>
          <button type="button" className="me-retry-btn" onClick={fetchEvents}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="me-empty" role="status" aria-live="polite">
          <span>📭</span>
          <p>No events match your current search and filter.</p>
        </div>
      ) : (
        <div className="me-table-wrapper">
          <table className="me-table" id="manage-events-table">
            <caption className="me-sr-only">Manage events list with status and moderation actions</caption>
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Department</th>
                <th scope="col">Date</th>
                <th scope="col">Venue</th>
                <th scope="col">Participants</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev, index) => {
                const badge = STATUS_BADGE[ev.status] || STATUS_BADGE.pending;
                const id = ev._id || ev.id;
                return (
                  <tr
                    key={id}
                    className="me-row"
                    style={{ cursor: "pointer", "--item-index": index }}
                    onClick={() => openEventDetails(ev)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openEventDetails(ev);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open details for ${ev.title}`}
                  >
                    <td>
                      <button
                        type="button"
                        className="me-event-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEventDetails(ev);
                        }}
                        aria-label={`Open event details for ${ev.title}`}
                      >
                        {ev.title}
                      </button>
                      <span className="me-event-organizer">{ev.organizer || (ev.createdBy && ev.createdBy.name) || "Unknown"}</span>
                    </td>
                    <td className="me-dept" data-label="Department">{ev.department}</td>
                    <td className="me-date" data-label="Date">
                      {formatEventDate(ev.date, { fallback: DATE_FALLBACK_TEXT })}
                    </td>
                    <td className="me-venue" data-label="Venue">{ev.venue}</td>
                    <td className="me-participants" data-label="Participants">{ev.participants || "--"}</td>
                    <td data-label="Status">
                      <span className={`me-badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td onClick={e => e.stopPropagation()} data-label="Actions">
                      <div className="me-actions">
                        {ev.status === "pending" ? (
                          <>
                            <button className="me-btn-approve" onClick={() => handleApprove(id)} title="Approve" aria-label={`Approve ${ev.title}`}>
                              ✓
                            </button>
                            <button className="me-btn-reject" onClick={() => handleReject(id)} title="Reject" aria-label={`Reject ${ev.title}`}>
                              ✗
                            </button>
                          </>
                        ) : (
                          <span className="me-final-state" title="Finalized event">
                            Finalized
                          </span>
                        )}
                        <button className="me-btn-delete" onClick={() => handleDelete(id)} title="Delete" aria-label={`Delete ${ev.title}`}>
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
