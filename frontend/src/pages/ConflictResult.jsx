import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import ConflictCard from "../components/ConflictCard";
import { createEvent, updateEvent, getEvents } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatTime12h } from "../utils/formatTime";
import "./ConflictResult.css";

export default function ConflictResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasConflict, eventData, conflicts = [], suggestions = [] } = location.state || {};
  
  const [submitting, setSubmitting] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(!eventData);

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
    const formattedDate = eventData.date
      ? new Date(eventData.date + "T00:00").toLocaleDateString("en-IN", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        })
      : "—";

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
                  {hasConflict ? "Scheduling Conflict Detected" : "No Conflicts Found"}
                </h1>
                <p className="cr-banner-desc">
                  {hasConflict
                    ? `AcadSync AI detected ${conflicts.length} potential conflict${conflicts.length !== 1 ? "s" : ""} with existing schedules.`
                    : "Your event schedule is clear and has been submitted for admin approval."}
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

            {hasConflict && suggestions.length > 0 && (
              <div className="cr-card cr-suggest-card">
                <div className="cr-suggest-header">
                  <div className="cr-ai-badge">AI</div>
                  <h2>Suggested Alternate Slots</h2>
                </div>
                <div className="cr-slot-list">
                  {suggestions.map((slot, idx) => (
                    <button key={idx} className="cr-slot-btn" onClick={() => navigate("/create-event", { state: { eventData: { ...eventData, startTime: slot.startTime, endTime: slot.endTime } } })}>
                      <div className="cr-slot-left">
                        <span className="cr-slot-date">{slot.date}</span>
                        <span className="cr-slot-time">{formatTime12h(slot.startTime)} – {formatTime12h(slot.endTime)}</span>
                      </div>
                      <div className="cr-slot-right">
                        <span className="cr-slot-label">{slot.label}</span>
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
                    <ConflictCard key={i} conflict={typeof c === 'string' ? { clashWith: c, severity: "high" } : c} />
                  ))}
                </div>

                <div className="cr-action-box">
                  <h3 className="cr-action-title">Proceed Anyway?</h3>
                  <p className="cr-action-desc">
                    You can submit this event despite conflicts, but it may be rejected by the administrator.
                  </p>
                  <button className="cr-btn-danger-outline" onClick={handleSubmitEvent} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit for Admin Review"}
                  </button>
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
                    <p className="cr-res-meta">{ev.venue} • {new Date(ev.date).toLocaleDateString()} • {formatTime12h(ev.startTime)}-{formatTime12h(ev.endTime)}</p>
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
