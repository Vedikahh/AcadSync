import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import {
  checkEventConflicts,
  getAdminDecisionAssistance,
  getEvents,
  updateEvent,
  updateEventStatus,
} from "../services/api";
import { formatTime12h } from "../utils/formatTime";
import "./AdminConflictResolver.css";

const PRIORITY_LABEL = {
  3: "Critical",
  2: "High",
  1: "Normal",
};

const inferPriorityFromText = (value = "") => {
  const text = String(value).toLowerCase();
  if (text.includes("exam")) return 3;
  if (text.includes("lecture") || text.includes("lab")) return 2;
  return 1;
};

const formatEventDate = (value) => {
  if (!value) return "TBA";
  const date = new Date(`${value}T00:00`);
  if (Number.isNaN(date.getTime())) return "TBA";
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const estimateScore = (event, detail) => {
  if (detail) {
    const conflicts = Array.isArray(detail.conflicts) ? detail.conflicts : [];
    const blockingConflicts = Array.isArray(detail.blockingConflicts) ? detail.blockingConflicts : [];
    const highestPriority = conflicts.reduce((max, item) => Math.max(max, item.priority || 1), 1);
    return (highestPriority * 100) + (blockingConflicts.length * 25) + (conflicts.length * 5);
  }

  const summary = Array.isArray(event.conflicts) ? event.conflicts : [];
  const highest = summary.reduce((max, text) => Math.max(max, inferPriorityFromText(text)), 1);
  return (highest * 100) + (summary.length * 5);
};

const recommendationFromDetail = (detail) => {
  if (!detail) {
    return {
      heading: "Load Details",
      text: "Open this item to compute exact pairwise conflicts and recommendations.",
      kind: "neutral",
    };
  }

  if (detail.blocked) {
    return {
      heading: "Do Not Approve Without Override",
      text: "This proposal overlaps with higher-priority schedules. Require a strong admin note if approving.",
      kind: "danger",
    };
  }

  const count = Array.isArray(detail.conflicts) ? detail.conflicts.length : 0;
  return {
    heading: "Needs Manual Review",
    text: `${count} overlapping item${count === 1 ? "" : "s"} detected. Reschedule is recommended before approval.`,
    kind: "warn",
  };
};

export default function AdminConflictResolver() {
  const [searchParams] = useSearchParams();
  const requestedEventId = searchParams.get("eventId") || "";
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [detailsById, setDetailsById] = useState({});
  const [onlyBlocking, setOnlyBlocking] = useState(false);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [selectedSuggestion, setSelectedSuggestion] = useState("");
  const [overrideNote, setOverrideNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [toast, setToast] = useState("");
  const [adminAssistById, setAdminAssistById] = useState({});
  const [loadingAdminAssist, setLoadingAdminAssist] = useState(false);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getEvents();
      const list = Array.isArray(data) ? data : [];
      const conflicting = list.filter((event) => Array.isArray(event.conflicts) && event.conflicts.length > 0);
      setEvents(conflicting);
    } catch (err) {
      setError(err.message || "Failed to load conflicts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const departments = useMemo(() => {
    const set = new Set();
    events.forEach((event) => {
      if (event.department) set.add(event.department);
    });
    return ["all", ...Array.from(set).sort()];
  }, [events]);

  const sortedFilteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events
      .filter((event) => {
        if (department !== "all" && event.department !== department) return false;

        const detail = detailsById[event._id || event.id];
        if (onlyBlocking && !detail?.blocked) return false;

        if (!term) return true;
        const haystack = [
          event.title,
          event.venue,
          event.department,
          ...(Array.isArray(event.conflicts) ? event.conflicts : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => {
        const scoreA = estimateScore(a, detailsById[a._id || a.id]);
        const scoreB = estimateScore(b, detailsById[b._id || b.id]);
        return scoreB - scoreA;
      });
  }, [department, detailsById, events, onlyBlocking, search]);

  useEffect(() => {
    if (!sortedFilteredEvents.length) {
      setSelectedId("");
      return;
    }

    if (requestedEventId) {
      const requested = sortedFilteredEvents.find((event) => (event._id || event.id) === requestedEventId);
      if (requested && selectedId !== requestedEventId) {
        setSelectedId(requestedEventId);
        return;
      }
    }

    const stillExists = sortedFilteredEvents.some((event) => (event._id || event.id) === selectedId);
    if (!stillExists) {
      setSelectedId(sortedFilteredEvents[0]._id || sortedFilteredEvents[0].id);
    }
  }, [requestedEventId, selectedId, sortedFilteredEvents]);

  const selectedEvent = sortedFilteredEvents.find((event) => (event._id || event.id) === selectedId);
  const selectedDetail = selectedEvent ? detailsById[selectedEvent._id || selectedEvent.id] : null;
  const selectedAssistant = selectedEvent ? adminAssistById[selectedEvent._id || selectedEvent.id] : null;

  const loadDetail = async (event, force = false) => {
    if (!event) return;
    const eventId = event._id || event.id;
    if (!force && detailsById[eventId]) return;

    try {
      setLoadingDetail(true);
      const detail = await checkEventConflicts({
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        type: event.type || "event",
      });
      setDetailsById((prev) => ({ ...prev, [eventId]: detail }));
    } catch (err) {
      showToast(err.message || "Failed to load pairwise conflict details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadAdminAssistance = async (event, detail, force = false) => {
    if (!event || !detail) return;
    const eventId = event._id || event.id;
    if (!force && adminAssistById[eventId]) return;

    try {
      setLoadingAdminAssist(true);
      const assistance = await getAdminDecisionAssistance({
        event: {
          title: event.title,
          type: event.type || "event",
          department: event.department,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
        },
        conflictDetail: {
          blocked: Boolean(detail?.blocked),
          hasConflict: Boolean(detail?.hasConflict),
          conflicts: Array.isArray(detail?.conflicts) ? detail.conflicts : [],
          blockingConflicts: Array.isArray(detail?.blockingConflicts) ? detail.blockingConflicts : [],
          suggestions: Array.isArray(detail?.suggestions) ? detail.suggestions : [],
        },
        policyFlags: {
          allowBlockedOverride: true,
          requireOverrideForBlocking: true,
        },
      });

      setAdminAssistById((prev) => ({ ...prev, [eventId]: assistance }));

      if ((selectedId === eventId) && !overrideNote.trim() && assistance?.adminReviewNoteDraft) {
        setOverrideNote(assistance.adminReviewNoteDraft);
      }
      if ((selectedId === eventId) && !rejectReason.trim() && assistance?.rejectionReasonDraft) {
        setRejectReason(assistance.rejectionReasonDraft);
      }
    } catch {
      // Keep current manual resolution flow untouched if assistant call fails.
    } finally {
      setLoadingAdminAssist(false);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      loadDetail(selectedEvent);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedEvent && selectedDetail) {
      loadAdminAssistance(selectedEvent, selectedDetail);
    }
  }, [selectedEvent, selectedDetail]);

  const recommendation = recommendationFromDetail(selectedDetail);

  const handleApprove = async () => {
    if (!selectedEvent) return;

    if (selectedDetail?.blocked && !overrideNote.trim()) {
      showToast("Override note is required for blocked conflicts.");
      return;
    }

    try {
      setBusyAction("approve");
      const id = selectedEvent._id || selectedEvent.id;
      const payload = overrideNote.trim() ? { note: overrideNote.trim() } : {};
      const updated = await updateEventStatus(id, "approved", payload);
      setEvents((prev) => prev.map((event) => ((event._id || event.id) === id ? updated : event)));
      showToast("Event approved.");
      setOverrideNote("");
      setRejectReason("");
    } catch (err) {
      showToast(err.message || "Failed to approve event.");
    } finally {
      setBusyAction("");
    }
  };

  const handleReject = async () => {
    if (!selectedEvent) return;
    if (!rejectReason.trim()) {
      showToast("Rejection reason is required.");
      return;
    }

    try {
      setBusyAction("reject");
      const id = selectedEvent._id || selectedEvent.id;
      const payload = {
        rejectionReason: rejectReason.trim(),
        ...(overrideNote.trim() ? { note: overrideNote.trim() } : {}),
      };
      const updated = await updateEventStatus(id, "rejected", payload);
      setEvents((prev) => prev.map((event) => ((event._id || event.id) === id ? updated : event)));
      showToast("Event rejected.");
      setOverrideNote("");
      setRejectReason("");
    } catch (err) {
      showToast(err.message || "Failed to reject event.");
    } finally {
      setBusyAction("");
    }
  };

  const handleReschedule = async () => {
    if (!selectedEvent) return;
    const suggestions = selectedDetail?.suggestions || [];
    const slot = suggestions[Number(selectedSuggestion)];
    if (!slot) {
      showToast("Select a suggested slot first.");
      return;
    }

    try {
      setBusyAction("reschedule");
      const id = selectedEvent._id || selectedEvent.id;
      const updated = await updateEvent(id, {
        startTime: slot.startTime,
        endTime: slot.endTime,
        type: selectedEvent.type || "event",
      });
      setEvents((prev) => prev.map((event) => ((event._id || event.id) === id ? updated : event)));
      setSelectedSuggestion("");
      await loadDetail(updated, true);
      showToast("Event time updated. Review and approve when ready.");
    } catch (err) {
      showToast(err.message || "Failed to reschedule event.");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <div className="acr-page">
      {toast && <div className="acr-toast">{toast}</div>}

      <header className="acr-header">
        <div>
          <h1>Conflict Resolver</h1>
          <p>Detailed pairwise analysis and direct actions for conflicting proposals.</p>
        </div>
        <Link className="acr-manage-link" to="/manage-events">Open Manage Events</Link>
      </header>

      <section className="acr-filters">
        <input
          type="text"
          value={search}
          placeholder="Search event, venue, clash..."
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          {departments.map((item) => (
            <option key={item} value={item}>{item === "all" ? "All departments" : item}</option>
          ))}
        </select>
        <label className="acr-checkbox">
          <input
            type="checkbox"
            checked={onlyBlocking}
            onChange={(e) => setOnlyBlocking(e.target.checked)}
          />
          Blocking only
        </label>
      </section>

      {loading ? (
        <div className="acr-state">Loading conflict queue...</div>
      ) : error ? (
        <div className="acr-state acr-error">{error}</div>
      ) : sortedFilteredEvents.length === 0 ? (
        <div className="acr-state">No conflicting proposals found for current filters.</div>
      ) : (
        <div className="acr-layout">
          <aside className="acr-list">
            {sortedFilteredEvents.map((event) => {
              const id = event._id || event.id;
              const detail = detailsById[id];
              const score = estimateScore(event, detail);
              const highestPriority = detail
                ? (detail.conflicts || []).reduce((max, item) => Math.max(max, item.priority || 1), 1)
                : (event.conflicts || []).reduce((max, text) => Math.max(max, inferPriorityFromText(text)), 1);
              return (
                <button
                  key={id}
                  className={`acr-item ${selectedId === id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedId(id);
                    loadDetail(event);
                  }}
                >
                  <div className="acr-item-title">{event.title}</div>
                  <div className="acr-item-meta">{event.department || "General"} • {formatEventDate(event.date)}</div>
                  <div className="acr-badges">
                    <span className="acr-badge">Score {score}</span>
                    <span className={`acr-badge p${highestPriority}`}>{PRIORITY_LABEL[highestPriority] || "Normal"}</span>
                    {detail?.blocked && <span className="acr-badge danger">Blocking</span>}
                  </div>
                </button>
              );
            })}
          </aside>

          <section className="acr-detail">
            {selectedEvent ? (
              <>
                <div className="acr-panel">
                  <h2>{selectedEvent.title}</h2>
                  <p>{selectedEvent.description || "No description"}</p>
                  <div className="acr-meta-grid">
                    <span>Date: {formatEventDate(selectedEvent.date)}</span>
                    <span>Time: {formatTime12h(selectedEvent.startTime)} - {formatTime12h(selectedEvent.endTime)}</span>
                    <span>Venue: {selectedEvent.venue || "TBA"}</span>
                    <span>Status: {selectedEvent.status}</span>
                  </div>
                </div>

                <div className={`acr-panel acr-reco ${recommendation.kind}`}>
                  <h3>{recommendation.heading}</h3>
                  <p>{recommendation.text}</p>
                </div>

                {selectedAssistant && (
                  <div className="acr-panel acr-ai-panel">
                    <div className="acr-ai-header">
                      <h3>Assistant Recommendation</h3>
                      <span className={`acr-badge ${selectedAssistant.source === "ai" ? "p1" : "danger"}`}>
                        {selectedAssistant.source === "ai" ? "AI + Rules" : "Rules fallback"}
                      </span>
                    </div>
                    <div className="acr-ai-grid">
                      <span><strong>Decision:</strong> {String(selectedAssistant.decision || "manual_review").replaceAll("_", " ")}</span>
                      <span><strong>Severity:</strong> {String(selectedAssistant.severity || "medium").toUpperCase()}</span>
                    </div>
                    {Array.isArray(selectedAssistant.rationale) && selectedAssistant.rationale.length > 0 && (
                      <ul className="acr-ai-rationale">
                        {selectedAssistant.rationale.map((item, idx) => (
                          <li key={`${idx}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {Array.isArray(selectedAssistant.flags) && selectedAssistant.flags.length > 0 && (
                      <div className="acr-ai-flags">
                        {selectedAssistant.flags.map((flag) => (
                          <span key={flag} className="acr-badge">{flag}</span>
                        ))}
                      </div>
                    )}
                    {selectedAssistant.recommendedSlot && (
                      <p className="acr-ai-slot">
                        <strong>Recommended slot:</strong> {selectedAssistant.recommendedSlot.date} • {formatTime12h(selectedAssistant.recommendedSlot.startTime)} - {formatTime12h(selectedAssistant.recommendedSlot.endTime)}
                      </p>
                    )}
                  </div>
                )}

                <div className="acr-panel">
                  <div className="acr-panel-title-row">
                    <h3>Pairwise Conflicts</h3>
                    {loadingDetail && <span>Refreshing details...</span>}
                  </div>
                  {!selectedDetail ? (
                    <p>Click this item to load pairwise conflict detail.</p>
                  ) : selectedDetail.conflicts?.length ? (
                    <div className="acr-conflict-table">
                      {selectedDetail.conflicts
                        .slice()
                        .sort((a, b) => (b.priority || 1) - (a.priority || 1))
                        .map((conflict, index) => (
                          <div key={`${conflict.title}-${index}`} className="acr-conflict-row">
                            <div>
                              <strong>{conflict.title}</strong>
                              <p>{conflict.message}</p>
                            </div>
                            <div className="acr-conflict-tags">
                              <span className={`acr-badge p${conflict.priority || 1}`}>{PRIORITY_LABEL[conflict.priority || 1] || "Normal"}</span>
                              <span className="acr-badge">{conflict.source}</span>
                              {conflict.isBlocking && <span className="acr-badge danger">Blocking</span>}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p>No active pairwise conflicts found for current schedule.</p>
                  )}
                </div>

                <div className="acr-panel">
                  <h3>Suggested Reschedule Slots</h3>
                  {!selectedDetail?.suggestions?.length ? (
                    <p>No alternate slots generated.</p>
                  ) : (
                    <div className="acr-suggestion-list">
                      {selectedDetail.suggestions.map((slot, index) => (
                        <label key={`${slot.startTime}-${slot.endTime}-${index}`}>
                          <input
                            type="radio"
                            name="acr-suggestion"
                            value={String(index)}
                            checked={selectedSuggestion === String(index)}
                            onChange={(e) => setSelectedSuggestion(e.target.value)}
                          />
                          <span>{slot.date} • {formatTime12h(slot.startTime)} - {formatTime12h(slot.endTime)} ({slot.label})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="acr-panel">
                  <h3>Resolution Actions</h3>
                  {loadingAdminAssist && <p>Loading assistant recommendation...</p>}
                  <textarea
                    value={overrideNote}
                    onChange={(e) => setOverrideNote(e.target.value)}
                    placeholder="Admin override/review note (required for blocked approvals)"
                    rows={3}
                  />
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Rejection reason (required for reject)"
                    rows={3}
                  />
                  <div className="acr-actions">
                    <button
                      className="acr-btn approve"
                      disabled={busyAction !== ""}
                      onClick={handleApprove}
                    >
                      {busyAction === "approve" ? "Approving..." : "Approve"}
                    </button>
                    <button
                      className="acr-btn reject"
                      disabled={busyAction !== ""}
                      onClick={handleReject}
                    >
                      {busyAction === "reject" ? "Rejecting..." : "Reject"}
                    </button>
                    <button
                      className="acr-btn reschedule"
                      disabled={busyAction !== ""}
                      onClick={handleReschedule}
                    >
                      {busyAction === "reschedule" ? "Rescheduling..." : "Apply Suggested Slot"}
                    </button>
                    <Link className="acr-btn fallback" to="/manage-events">Open in Manage Events</Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="acr-state">Select a proposal from the left to begin resolution.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
