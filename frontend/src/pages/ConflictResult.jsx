import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import ConflictCard from "../components/ConflictCard";
import { createEvent, updateEvent, getEvents } from "../services/api";
import { formatTime12h } from "../utils/formatTime";
import { formatEventDate, formatEventDateLong, DATE_FALLBACK_TEXT } from "../utils/formatDate";
import "./ConflictResult.css";

export default function ConflictResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    hasConflict,
    eventData,
    conflicts = [],
    suggestions = [],
    blocked = false,
    blockingConflicts = [],
    aiAssistance = null,
    ai = { enabled: false, available: false, provider: "rules", reason: "disabled_by_config" },
  } = location.state || {};
  const aiAvailable = Boolean(ai?.available);
  const aiEnabled = Boolean(ai?.enabled);
  const assistantSlots = Array.isArray(aiAssistance?.recommendedSlots) ? aiAssistance.recommendedSlots : [];
  const displaySlots = assistantSlots.length > 0 ? assistantSlots : suggestions;
  
  const [submitting, setSubmitting] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(!eventData);
  const normalizedConflicts = useMemo(
    () => conflicts.map((item) => {
      if (typeof item === "string") {
        return {
          clashWith: item,
          eventName: eventData?.title || "Proposed event",
          severity: "high",
          date: eventData?.date,
          timeOverlap: `${eventData?.startTime || "--"} - ${eventData?.endTime || "--"}`,
        };
      }

      return {
        eventName: eventData?.title || "Proposed event",
        clashWith: item?.title || item?.clashWith || "Existing schedule item",
        date: item?.dateIso || item?.date,
        conflictWindow: item?.conflictWindow,
        timeOverlap: item?.timeOverlap,
        severity: item?.isBlocking ? "high" : "medium",
        priority: item?.priority,
        isBlocking: Boolean(item?.isBlocking),
        blockingReason: item?.blockingReason,
        message: item?.message,
      };
    }),
    [conflicts, eventData]
  );

  useEffect(() => {
    if (!eventData) {
      fetchAllEvents();
    }
  }, [eventData]);

  const fetchAllEvents = async () => {
    try {
      setIsLoading(true);
      const data = await getEvents();
      setAllEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEvent = async () => {
    if (!eventData) return;
    if (blocked) {
      alert("This time conflicts with a higher-priority schedule. Please choose another slot.");
      return;
    }
    try {
      setSubmitting(true);
      const eventId = eventData.id || eventData._id;
      
      if (eventId) {
        await updateEvent(eventId, eventData);
      } else {
        await createEvent(eventData);
      }
      
      navigate("/events"); 
    } catch (err) {
      alert("Failed to submit event: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // If we have eventData, we are in the "Result" view for a specific proposal
  if (eventData) {
    const formattedDate = formatEventDateLong(eventData.date, DATE_FALLBACK_TEXT);

    return (
      <div className="cr-page">
        <div className="cr-top-bar">
          <button className="cr-btn-back" onClick={() => navigate(-1)}>
            <span className="cr-back-arrow">←</span> Back to Edit
          </button>
        </div>

        <div className="cr-grid">
          <div className="cr-col-main">
            <div className={`cr-banner ${hasConflict ? "cr-banner-conflict" : "cr-banner-success"}`}>
              <div className="cr-banner-icon">{hasConflict ? "!" : "✓"}</div>
              <div className="cr-banner-text">
                <h1 className="cr-banner-title">
                  {!hasConflict
                    ? "No Conflicts Found"
                    : blocked
                      ? "Blocked by Higher-Priority Schedule"
                      : "Scheduling Conflict Detected"}
                </h1>
                <p className="cr-banner-desc">
                  {!hasConflict
                    ? "Your event schedule is clear and has been submitted for admin approval."
                    : blocked
                      ? `This time overlaps with ${blockingConflicts.length || conflicts.length} higher-priority schedule${(blockingConflicts.length || conflicts.length) !== 1 ? "s" : ""}. Please choose another slot.`
                      : aiAvailable
                        ? `AI assist and rule checks detected ${conflicts.length} potential conflict${conflicts.length !== 1 ? "s" : ""} with existing schedules.`
                        : `The conflict engine detected ${conflicts.length} potential conflict${conflicts.length !== 1 ? "s" : ""} with existing schedules.`}
                </p>
              </div>
              {!hasConflict && (
                <button onClick={handleSubmitEvent} className="cr-btn-success" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Event Now"}
                </button>
              )}
            </div>

            <div className="cr-card">
              <h2 className="cr-card-header">Proposed Event Details</h2>
              <div className="cr-event-info">
                <h3 className="cr-event-title">{eventData.title}</h3>
                <p className="cr-event-desc">{eventData.description}</p>
                
                <div className="cr-meta-grid">
                  <div className="cr-meta-item">
                    <span className="cr-meta-label">Date</span>
                    <span className="cr-meta-value">{formattedDate}</span>
                  </div>
                  <div className="cr-meta-item">
                    <span className="cr-meta-label">Time</span>
                    <span className="cr-meta-value">{formatTime12h(eventData.startTime)} – {formatTime12h(eventData.endTime)}</span>
                  </div>
                  <div className="cr-meta-item">
                    <span className="cr-meta-label">Venue</span>
                    <span className="cr-meta-value">{eventData.venue || "—"}</span>
                  </div>
                  <div className="cr-meta-item">
                    <span className="cr-meta-label">Department</span>
                    <span className="cr-meta-value">{eventData.department || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {hasConflict && displaySlots.length > 0 && (
              <div className="cr-card cr-suggest-card">
                <div className="cr-suggest-header">
                  {aiAvailable && <div className="cr-ai-badge">AI</div>}
                  <h2>Suggested Alternate Time Slots</h2>
                </div>
                {aiAssistance && (
                  <div className="cr-assistant-panel">
                    <h3>{aiAssistance.summary || "Assistant recommendation"}</h3>
                    {Array.isArray(aiAssistance.why) && aiAssistance.why.length > 0 && (
                      <ul className="cr-assistant-why">
                        {aiAssistance.why.map((reason, idx) => (
                          <li key={`${idx}-${reason}`}>{reason}</li>
                        ))}
                      </ul>
                    )}
                    <div className="cr-assistant-footer">
                      <span className={`cr-risk ${aiAssistance.riskLevel || "medium"}`}>
                        Risk: {String(aiAssistance.riskLevel || "medium").toUpperCase()}
                      </span>
                      <span className="cr-action">Action: {String(aiAssistance.recommendedAction || "manual_review").replaceAll("_", " ")}</span>
                      <span className="cr-confidence">
                        Confidence: {Math.round(Number(aiAssistance.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
                {aiEnabled && !aiAvailable && (
                  <p className="cr-action-desc">
                    AI assist is currently unavailable. Suggestions are generated by the built-in rules engine.
                  </p>
                )}
                {aiAssistance?.source === "rules" && (
                  <p className="cr-action-desc">Assistant unavailable, showing deterministic rules-only recommendations.</p>
                )}
                <div className="cr-slot-list">
                  {displaySlots.map((slot, idx) => (
                    <button key={idx} className="cr-slot-btn" onClick={() => navigate("/create-event", { state: { eventData: { ...eventData, startTime: slot.startTime, endTime: slot.endTime } } })}>
                      <div className="cr-slot-left">
                        <span className="cr-slot-date">{slot.date}</span>
                        <span className="cr-slot-time">{formatTime12h(slot.startTime)} – {formatTime12h(slot.endTime)}</span>
                      </div>
                      <div className="cr-slot-right">
                        <span className="cr-slot-label">{slot.label}</span>
                        {typeof slot.score === "number" && (
                          <span className="cr-slot-score">{Math.round(slot.score * 100)}%</span>
                        )}
                        <span className="cr-slot-action">Apply →</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {hasConflict && (
            <div className="cr-col-side">
              <div className="cr-conflicts-wrapper">
                <h2 className="cr-conflicts-title">Detected Clashes</h2>
                <div className="cr-conflicts-list">
                  {conflicts.map((c, i) => (
                    <ConflictCard key={i} conflict={normalizedConflicts[i]} />
                  ))}
                </div>

                <div className="cr-action-box">
                  {blocked ? (
                    <>
                      <h3 className="cr-action-title">Blocked by Higher Priority</h3>
                      <p className="cr-action-desc">
                        Lower-priority events cannot be scheduled over exams or lectures. Please choose a different slot.
                      </p>
                      {blockingConflicts.length > 0 && (
                        <ul className="cr-assistant-why">
                          {blockingConflicts.map((conflict, index) => (
                            <li key={`${conflict.title || "blocker"}-${index}`}>
                              {(conflict.blockingReason || conflict.message || "Higher-priority overlap detected.")}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="cr-action-title">Proceed Anyway?</h3>
                      <p className="cr-action-desc">
                        You can submit this event despite conflicts, but it may be rejected by the administrator.
                      </p>
                      <button className="cr-btn-danger-outline" onClick={handleSubmitEvent} disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit for Admin Review"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin resolution center view (All Conflicts)
  const conflictingEvents = allEvents.filter(e => e.conflicts && e.conflicts.length > 0);

  return (
    <div className="cr-page">
      <div className="cr-header-summary">
        <h1 className="cr-page-title">Conflict Resolution Center</h1>
        <p className="cr-page-sub">Review and resolve overlapping event proposals</p>
      </div>

      <div className="cr-main-content">
        {isLoading ? (
          <div className="cr-loading-state">Scanning schedules for conflicts...</div>
        ) : conflictingEvents.length === 0 ? (
          <div className="cr-empty-resolution">
            <div className="cr-empty-icon">✓</div>
            <h2>All Clear!</h2>
            <p>No active scheduling conflicts detected across the campus.</p>
            <Link to="/manage-events" className="cr-btn-primary">Manage All Events</Link>
          </div>
        ) : (
          <div className="cr-resolution-list">
            {conflictingEvents.map((ev) => (
              <div key={ev._id || ev.id} className="cr-res-item">
                <div className="cr-res-header">
                  <div>
                    <h3 className="cr-res-title">{ev.title}</h3>
                    <p className="cr-res-meta">{ev.venue} • {formatEventDate(ev.date, { fallback: DATE_FALLBACK_TEXT })} • {formatTime12h(ev.startTime)}-{formatTime12h(ev.endTime)}</p>
                  </div>
                  <Link to="/manage-events" className="cr-res-action">Review Proposal →</Link>
                </div>
                <div className="cr-res-clashes">
                  {ev.conflicts.map((c, i) => (
                    <div key={i} className="cr-clash-pill">
                      <span className="cr-clash-icon">!</span>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
