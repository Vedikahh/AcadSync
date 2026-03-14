import { useLocation, useNavigate, Link } from "react-router-dom";
import ConflictCard from "../components/ConflictCard";
import "./ConflictResult.css";

export default function ConflictResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasConflict, eventData, conflicts = [] } = location.state || {};

  // Guard: if someone navigates directly without state
  if (!eventData) {
    return (
      <div className="cr-page">
        <div className="cr-card cr-no-state">
          <span>❓</span>
          <h2>No result to display</h2>
          <p>Please submit an event first to see the conflict check result.</p>
          <Link to="/create-event" className="cr-btn-primary">Create an Event</Link>
        </div>
      </div>
    );
  }

  const formattedDate = eventData.date
    ? new Date(eventData.date + "T00:00").toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "—";

  return (
    <div className="cr-page">
      {/* Result banner */}
      <div className={`cr-banner ${hasConflict ? "cr-banner-conflict" : "cr-banner-clear"}`}>
        <span className="cr-banner-icon">{hasConflict ? "⚠️" : "✅"}</span>
        <div>
          <h1 className="cr-banner-title">
            {hasConflict ? "Scheduling Conflict Detected" : "No Conflicts Found!"}
          </h1>
          <p className="cr-banner-sub">
            {hasConflict
              ? `${conflicts.length} conflict${conflicts.length > 1 ? "s" : ""} detected with existing schedule. Review below and choose an action.`
              : "Your event has no scheduling conflicts. It has been submitted for admin approval."}
          </p>
        </div>
      </div>

      {/* Event summary */}
      <div className="cr-event-summary">
        <p className="cr-section-label">Submitted Event</p>
        <div className="cr-event-card">
          <div className="cr-event-main">
            <h2 className="cr-event-title">{eventData.title}</h2>
            <p className="cr-event-desc">{eventData.description}</p>
          </div>
          <div className="cr-event-meta">
            <div className="cr-meta-item">
              <span className="cr-meta-label">📅 Date</span>
              <span>{formattedDate}</span>
            </div>
            <div className="cr-meta-item">
              <span className="cr-meta-label">⏰ Time</span>
              <span>{eventData.startTime} – {eventData.endTime}</span>
            </div>
            <div className="cr-meta-item">
              <span className="cr-meta-label">📍 Venue</span>
              <span>{eventData.venue || "—"}</span>
            </div>
            <div className="cr-meta-item">
              <span className="cr-meta-label">🏢 Department</span>
              <span>{eventData.department || "—"}</span>
            </div>
            {eventData.participants && (
              <div className="cr-meta-item">
                <span className="cr-meta-label">👥 Participants</span>
                <span>~{eventData.participants}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conflict list */}
      {hasConflict && conflicts.length > 0 && (
        <div className="cr-conflicts-section">
          <p className="cr-section-label">⚠️ Detected Conflicts</p>
          <p className="cr-conflicts-hint">
            The following existing schedule items overlap with your proposed event. 
            You can edit the event or proceed and notify admin.
          </p>
          <div className="cr-conflicts-list">
            {conflicts.map((c) => (
              <ConflictCard key={c.id} conflict={c} />
            ))}
          </div>

          {/* Suggested alternates */}
          <div className="cr-suggest-box">
            <p className="cr-suggest-label">🤖 AI Suggested Alternate Slots</p>
            <div className="cr-suggest-slots">
              {[
                { time: "16:00 – 18:00", label: "After classes end" },
                { time: "12:30 – 14:00", label: "Lunch break window" },
                { time: "Sat 10:00 – 13:00", label: "Weekend slot" },
              ].map((slot) => (
                <div key={slot.time} className="cr-slot">
                  <span className="cr-slot-time">{slot.time}</span>
                  <span className="cr-slot-label">{slot.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="cr-actions">
        <button className="cr-btn-outline" onClick={() => navigate(-1)}>
          ← Edit Event
        </button>
        {hasConflict ? (
          <button
            className="cr-btn-primary"
            onClick={() => navigate("/dashboard")}
          >
            Submit Anyway (Admin Review)
          </button>
        ) : (
          <Link to="/dashboard" className="cr-btn-primary">
            🎉 Go to Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
