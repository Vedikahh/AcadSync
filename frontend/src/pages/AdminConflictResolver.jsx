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
import { formatEventDateWithWeekday, DATE_FALLBACK_TEXT } from "../utils/formatDate";
import "./AdminConflictResolver.css";

const PRIORITY_LABEL = {
  3: "Critical",
  2: "High",
  1: "Normal",
};

const initialDraft = () => ({
  selectedSuggestion: "",
  overrideNote: "",
  rejectReason: "",
});

const inferPriorityFromText = (value = "") => {
  const text = String(value).toLowerCase();
  if (text.includes("exam")) return 3;
  if (text.includes("lecture") || text.includes("lab")) return 2;
  return 1;
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
    const blockingCount = Array.isArray(detail.blockingConflicts) ? detail.blockingConflicts.length : 0;
    return {
      heading: "Do Not Approve Without Override",
      text: `Blocked by ${blockingCount || 1} higher-priority overlap${blockingCount === 1 ? "" : "s"}. Require a strong admin note if approving.`,
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
  const [draftsById, setDraftsById] = useState({});
  const [resolutionMode, setResolutionMode] = useState("approve");
  const [busyAction, setBusyAction] = useState("");
  const [toast, setToast] = useState("");
  const [adminAssistById, setAdminAssistById] = useState({});
  const [loadingAdminAssist, setLoadingAdminAssist] = useState(false);
  const [showAssistantDetails, setShowAssistantDetails] = useState(false);

  const upsertDraft = (eventId, patch) => {
    if (!eventId) return;
    setDraftsById((prev) => ({
      ...prev,
      [eventId]: { ...(prev[eventId] || initialDraft()), ...patch },
    }));
  };

  const resetDraft = (eventId) => {
    if (!eventId) return;
    setDraftsById((prev) => ({ ...prev, [eventId]: initialDraft() }));
  };

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getEvents({ limit: 100, offset: 0, sort: "-createdAt" });
      const list = Array.isArray(data) ? data : [];
      const conflicting = list.filter(
        (event) => event.status === "pending" && Array.isArray(event.conflicts) && event.conflicts.length > 0
      );
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
        if (event.status !== "pending") return false;
        if (!Array.isArray(event.conflicts) || event.conflicts.length === 0) return false;
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

  useEffect(() => {
    setResolutionMode("approve");
  }, [selectedId]);

  useEffect(() => {
    setShowAssistantDetails(false);
  }, [selectedId]);

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
        excludeEventId: eventId,
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

      if (selectedId === eventId) {
        setDraftsById((prev) => {
          const current = prev[eventId] || initialDraft();
          const next = { ...current };

          if (!current.overrideNote.trim() && assistance?.adminReviewNoteDraft) {
            next.overrideNote = assistance.adminReviewNoteDraft;
          }
          if (!current.rejectReason.trim() && assistance?.rejectionReasonDraft) {
            next.rejectReason = assistance.rejectionReasonDraft;
          }

          return { ...prev, [eventId]: next };
        });
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
  const selectedEventId = selectedEvent ? (selectedEvent._id || selectedEvent.id) : "";
  const selectedDraft = selectedEventId ? (draftsById[selectedEventId] || initialDraft()) : initialDraft();
  const selectedSuggestionIndex = Number(selectedDraft.selectedSuggestion);
  const selectedSuggestionLabel = Number.isNaN(selectedSuggestionIndex) ? "" : selectedDraft.selectedSuggestion;
  const isBlocked = Boolean(selectedDetail?.blocked);
  const isBusy = busyAction !== "";
  const approveRequiresNote = isBlocked && !selectedDraft.overrideNote.trim();
  const rejectRequiresReason = !selectedDraft.rejectReason.trim();
  const hasSuggestions = Boolean(selectedDetail?.suggestions?.length);
  const detailedBlockingConflicts = useMemo(
    () => (Array.isArray(selectedDetail?.blockingConflicts) ? selectedDetail.blockingConflicts : []),
    [selectedDetail]
  );
  const rescheduleRequiresSlot = hasSuggestions && Number.isNaN(selectedSuggestionIndex);

  const approveDisabledReason = isBusy
    ? "Wait for the current action to complete."
    : (approveRequiresNote ? "Add override note to approve blocked event." : "");
  const rejectDisabledReason = isBusy
    ? "Wait for the current action to complete."
    : (rejectRequiresReason ? "Add rejection reason before rejecting." : "");
  const rescheduleDisabledReason = isBusy
    ? "Wait for the current action to complete."
    : (!hasSuggestions
      ? "No suggested slot available for this event."
      : (rescheduleRequiresSlot ? "Select a suggested slot before applying." : ""));

  const handleApprove = async () => {
    if (!selectedEvent) return;

    if (selectedDetail?.blocked && !selectedDraft.overrideNote.trim()) {
      showToast("Override note is required for blocked conflicts.");
      return;
    }

    try {
      setBusyAction("approve");
      const id = selectedEvent._id || selectedEvent.id;
      const payload = selectedDraft.overrideNote.trim() ? { note: selectedDraft.overrideNote.trim() } : {};
      await updateEventStatus(id, "approved", payload);
      setEvents((prev) => prev.filter((event) => ((event._id || event.id) !== id)));
      setDetailsById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setAdminAssistById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showToast("Event approved.");
      resetDraft(id);
    } catch (err) {
      showToast(err.message || "Failed to approve event.");
    } finally {
      setBusyAction("");
    }
  };

  const handleReject = async () => {
    if (!selectedEvent) return;
    if (!selectedDraft.rejectReason.trim()) {
      showToast("Rejection reason is required.");
      return;
    }

    try {
      setBusyAction("reject");
      const id = selectedEvent._id || selectedEvent.id;
      const payload = {
        rejectionReason: selectedDraft.rejectReason.trim(),
        ...(selectedDraft.overrideNote.trim() ? { note: selectedDraft.overrideNote.trim() } : {}),
      };
      await updateEventStatus(id, "rejected", payload);
      setEvents((prev) => prev.filter((event) => ((event._id || event.id) !== id)));
      setDetailsById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setAdminAssistById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showToast("Event rejected.");
      resetDraft(id);
    } catch (err) {
      showToast(err.message || "Failed to reject event.");
    } finally {
      setBusyAction("");
    }
  };

  const handleReschedule = async () => {
    if (!selectedEvent) return;
    const suggestions = selectedDetail?.suggestions || [];
    const slot = suggestions[selectedSuggestionIndex];
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
      upsertDraft(id, { selectedSuggestion: "" });
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
      {toast && <div className="acr-toast" role="status" aria-live="polite" aria-atomic="true">{toast}</div>}

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
            <div className="acr-list-header">
              <strong>Conflict Queue</strong>
              <span>{sortedFilteredEvents.length} item{sortedFilteredEvents.length === 1 ? "" : "s"}</span>
            </div>
            {sortedFilteredEvents.map((event) => {
              const id = event._id || event.id;
              const detail = detailsById[id];
              const score = estimateScore(event, detail);
              const highestPriority = detail
                ? (detail.conflicts || []).reduce((max, item) => Math.max(max, item.priority || 1), 1)
                : (event.conflicts || []).reduce((max, text) => Math.max(max, inferPriorityFromText(text)), 1);
              const riskLabel = PRIORITY_LABEL[highestPriority] || "Normal";
              return (
                <button
                  key={id}
                  className={`acr-item ${selectedId === id ? "active" : ""}`}
                  aria-label={`Review ${event.title} for conflict resolution`}
                  onClick={() => {
                    setSelectedId(id);
                    loadDetail(event);
                  }}
                >
                  <div className="acr-item-title">{event.title}</div>
                  <div className="acr-item-meta">{event.department || "General"} • {formatEventDateWithWeekday(event.date, DATE_FALLBACK_TEXT)}</div>
                  <div className="acr-badges">
                    <span className={`acr-badge p${highestPriority}`} title={`Calculated score ${score}`}>
                      Risk {riskLabel}
                    </span>
                    {detail?.blocked && <span className="acr-badge danger">Blocking</span>}
                  </div>
                </button>
              );
            })}
          </aside>

          <section className="acr-detail">
            {selectedEvent ? (
              <>
                <div className="acr-panel acr-guide">
                  <h3>Quick Flow</h3>
                  <p>Review conflicts first, then choose one action: approve, reject, or apply a suggested slot.</p>
                </div>

                <div className="acr-panel">
                  <h2>{selectedEvent.title}</h2>
                  <p>{selectedEvent.description || "No description"}</p>
                  <div className="acr-meta-grid">
                    <span>Date: {formatEventDateWithWeekday(selectedEvent.date, DATE_FALLBACK_TEXT)}</span>
                    <span>Time: {formatTime12h(selectedEvent.startTime)} - {formatTime12h(selectedEvent.endTime)}</span>
                    <span>Venue: {selectedEvent.venue || "To be announced"}</span>
                    <span>Status: {selectedEvent.status}</span>
                  </div>
                </div>

                <div className={`acr-panel acr-reco ${recommendation.kind}`}>
                  <h3>{recommendation.heading}</h3>
                  <p>{recommendation.text}</p>
                </div>

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

                <div className="acr-panel acr-action-panel">
                    <h3>Resolution Actions</h3>
                    {loadingAdminAssist && <p>Loading assistant recommendation...</p>}
                    <div className="acr-mode-switch" role="tablist" aria-label="Resolution mode">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={resolutionMode === "approve"}
                        className={`acr-mode-btn ${resolutionMode === "approve" ? "active" : ""}`}
                        onClick={() => setResolutionMode("approve")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={resolutionMode === "reject"}
                        className={`acr-mode-btn ${resolutionMode === "reject" ? "active" : ""}`}
                        onClick={() => setResolutionMode("reject")}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={resolutionMode === "reschedule"}
                        className={`acr-mode-btn ${resolutionMode === "reschedule" ? "active" : ""}`}
                        onClick={() => setResolutionMode("reschedule")}
                      >
                        Reschedule
                      </button>
                    </div>

                    {resolutionMode === "approve" && (
                      <div className="acr-mode-panel">
                        <p className="acr-mode-help">
                          {isBlocked
                            ? "Blocked conflict: add an override note before approval."
                            : "No blocking rule found. You can approve immediately."}
                        </p>
                        {isBlocked && detailedBlockingConflicts.length > 0 && (
                          <div className="acr-blocking-reasons">
                            <h4>What Is Blocking This Approval</h4>
                            <ul>
                              {detailedBlockingConflicts.map((conflict, index) => (
                                <li key={`${conflict.title || "item"}-${index}`}>
                                  <strong>{conflict.title || "Schedule item"}</strong>
                                  <span>
                                    {formatEventDateWithWeekday(conflict.dateIso || conflict.date, DATE_FALLBACK_TEXT)} | {formatTime12h(conflict.startTime)} - {formatTime12h(conflict.endTime)} | Priority {PRIORITY_LABEL[conflict.priority || 1] || "Normal"}
                                  </span>
                                  <span>{conflict.blockingReason || conflict.message || "This overlap has higher priority and requires admin override."}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <ul className="acr-checklist">
                          <li className={isBlocked ? "done" : "pending"}>{isBlocked ? "Done" : "Not needed"} Review if this event is blocked</li>
                          <li className={isBlocked && approveRequiresNote ? "pending" : "done"}>
                            {isBlocked && approveRequiresNote ? "Pending" : "Done"} Provide override note for blocked approval
                          </li>
                        </ul>
                        {isBlocked && (
                          <textarea
                            value={selectedDraft.overrideNote}
                            onChange={(e) => upsertDraft(selectedEventId, { overrideNote: e.target.value })}
                            placeholder="Admin override note"
                            rows={3}
                          />
                        )}
                        {approveRequiresNote && <p className="acr-inline-warning">Override note is required to approve this blocked event.</p>}
                        {approveDisabledReason && <p className="acr-disabled-reason">{approveDisabledReason}</p>}
                        <button
                          className="acr-btn approve"
                          disabled={isBusy || approveRequiresNote}
                          onClick={handleApprove}
                        >
                          {busyAction === "approve" ? "Approving..." : "Approve Event"}
                        </button>
                      </div>
                    )}

                    {resolutionMode === "reject" && (
                      <div className="acr-mode-panel">
                        <p className="acr-mode-help">Provide a clear reason so organizer can revise and resubmit.</p>
                        <ul className="acr-checklist">
                          <li className="done">Done Review conflict summary</li>
                          <li className={rejectRequiresReason ? "pending" : "done"}>
                            {rejectRequiresReason ? "Pending" : "Done"} Enter rejection reason
                          </li>
                        </ul>
                        <textarea
                          value={selectedDraft.rejectReason}
                          onChange={(e) => upsertDraft(selectedEventId, { rejectReason: e.target.value })}
                          placeholder="Rejection reason"
                          rows={3}
                        />
                        {rejectRequiresReason && <p className="acr-inline-warning">Rejection reason is required.</p>}
                        {rejectDisabledReason && <p className="acr-disabled-reason">{rejectDisabledReason}</p>}
                        <button
                          className="acr-btn reject"
                          disabled={isBusy || rejectRequiresReason}
                          onClick={handleReject}
                        >
                          {busyAction === "reject" ? "Rejecting..." : "Reject Event"}
                        </button>
                      </div>
                    )}

                    {resolutionMode === "reschedule" && (
                      <div className="acr-mode-panel">
                        <p className="acr-mode-help">Pick one suggested slot and apply it before approving.</p>
                        <ul className="acr-checklist">
                          <li className={hasSuggestions ? "done" : "pending"}>{hasSuggestions ? "Done" : "Pending"} Suggested slots available</li>
                          <li className={hasSuggestions && rescheduleRequiresSlot ? "pending" : "done"}>
                            {hasSuggestions && rescheduleRequiresSlot ? "Pending" : "Done"} Select one slot
                          </li>
                        </ul>
                        {!hasSuggestions ? (
                          <p>No alternate slots generated for this event.</p>
                        ) : (
                          <div className="acr-suggestion-list">
                            {selectedDetail.suggestions.map((slot, index) => (
                              <label key={`${slot.startTime}-${slot.endTime}-${index}`}>
                                <input
                                  type="radio"
                                  name={`acr-suggestion-${selectedEventId}`}
                                  value={String(index)}
                                  checked={selectedSuggestionLabel === String(index)}
                                  onChange={(e) => upsertDraft(selectedEventId, { selectedSuggestion: e.target.value })}
                                />
                                <span>{slot.date} • {formatTime12h(slot.startTime)} - {formatTime12h(slot.endTime)} ({slot.label})</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {hasSuggestions && rescheduleRequiresSlot && <p className="acr-inline-warning">Select a suggested slot first.</p>}
                        {rescheduleDisabledReason && <p className="acr-disabled-reason">{rescheduleDisabledReason}</p>}
                        <button
                          className="acr-btn reschedule"
                          disabled={isBusy || !hasSuggestions || rescheduleRequiresSlot}
                          onClick={handleReschedule}
                        >
                          {busyAction === "reschedule" ? "Rescheduling..." : "Apply Suggested Slot"}
                        </button>
                      </div>
                    )}

                    <div className="acr-actions acr-actions-foot">
                      <Link className="acr-btn fallback" to="/manage-events">Open in Manage Events</Link>
                    </div>
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
                    <button
                      type="button"
                      className="acr-toggle-details"
                      onClick={() => setShowAssistantDetails((prev) => !prev)}
                    >
                      {showAssistantDetails ? "Hide details" : "Show details"}
                    </button>
                    {showAssistantDetails && (
                      <>
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
                      </>
                    )}
                  </div>
                )}
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
