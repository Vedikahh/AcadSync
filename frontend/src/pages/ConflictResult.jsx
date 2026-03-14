import { useLocation, useNavigate, Link } from "react-router-dom";
import ConflictCard from "../components/ConflictCard";
import "./ConflictResult.css";

export default function ConflictResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasConflict, eventData, conflicts = [] } = location.state || {};

  // For testing, mock data if accessed directly without state
  const isDemo = !eventData;
  const demoEvent = {
    title: "Annual Tech Fest 2025",
    description: "A two-day celebration of technology, innovation, and creativity.",
    date: "2025-11-15",
    startTime: "09:00",
    endTime: "18:00",
    venue: "Main Auditorium",
    department: "Computer Science",
    participants: 400
  };
  
  const displayEvent = isDemo ? demoEvent : eventData;
  const displayConflicts = isDemo ? [
    { id: 1, eventName: "Annual Tech Fest 2025", severity: "high", clashWith: "Data Structures & Algorithms Lecture", timeOverlap: "09:00 – 10:00", venue: "Main Auditorium", date: "Nov 15, 2025", affectedStudents: 120 }
  ] : conflicts;
  const displayHasConflict = isDemo ? true : hasConflict;

  const formattedDate = displayEvent.date
    ? new Date(displayEvent.date + "T00:00").toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "—";

  return (
    <div className="cr-page">
      {/* Top action bar */}
      <div className="cr-top-bar">
        <button className="cr-btn-back" onClick={() => navigate(-1)}>
          <span className="cr-back-arrow">←</span> Back to Edit
        </button>
      </div>

      {/* Main content grid */}
      <div className="cr-grid">
        
        {/* Left column: Event details & AI suggestions */}
        <div className="cr-col-main">
          
          {/* Result banner */}
          <div className={`cr-banner ${displayHasConflict ? "cr-banner-conflict" : "cr-banner-success"}`}>
            <div className="cr-banner-icon">{displayHasConflict ? "!" : "✓"}</div>
            <div className="cr-banner-text">
              <h1 className="cr-banner-title">
                {displayHasConflict ? "Scheduling Conflict Detected" : "No Conflicts Found"}
              </h1>
              <p className="cr-banner-desc">
                {displayHasConflict
                  ? `AcadSync AI detected ${displayConflicts.length} potential conflict${displayConflicts.length !== 1 ? "s" : ""} with existing schedules.`
                  : "Your event schedule is clear and has been submitted for admin approval."}
              </p>
            </div>
            {!displayHasConflict && (
              <Link to="/dashboard" className="cr-btn-success">Go to Dashboard</Link>
            )}
          </div>

          {/* Event Summary Card */}
          <div className="cr-card">
            <h2 className="cr-card-header">Proposed Event Details</h2>
            <div className="cr-event-info">
              <h3 className="cr-event-title">{displayEvent.title}</h3>
              <p className="cr-event-desc">{displayEvent.description}</p>
              
              <div className="cr-meta-grid">
                <div className="cr-meta-item">
                  <span className="cr-meta-label">Date</span>
                  <span className="cr-meta-value">{formattedDate}</span>
                </div>
                <div className="cr-meta-item">
                  <span className="cr-meta-label">Time</span>
                  <span className="cr-meta-value">{displayEvent.startTime} – {displayEvent.endTime}</span>
                </div>
                <div className="cr-meta-item">
                  <span className="cr-meta-label">Venue</span>
                  <span className="cr-meta-value">{displayEvent.venue || "—"}</span>
                </div>
                <div className="cr-meta-item">
                  <span className="cr-meta-label">Department</span>
                  <span className="cr-meta-value">{displayEvent.department || "—"}</span>
                </div>
                {displayEvent.participants && (
                  <div className="cr-meta-item">
                    <span className="cr-meta-label">Expected Participants</span>
                    <span className="cr-meta-value">~{displayEvent.participants}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Suggestions (Only show if there are conflicts) */}
          {displayHasConflict && (
            <div className="cr-card cr-suggest-card">
              <div className="cr-suggest-header">
                <div className="cr-ai-badge">AI</div>
                <h2>Suggested Alternate Slots</h2>
              </div>
              <p className="cr-suggest-desc">
                AcadSync AI found the following available time slots with zero conflicts for your venue and expected capacity:
              </p>
              <div className="cr-slot-list">
                {[
                  { id: 1, date: "Nov 16, 2025", time: "16:00 – 18:00", label: "After classes end" },
                  { id: 2, date: "Nov 17, 2025", time: "12:30 – 14:00", label: "Lunch break window" },
                  { id: 3, date: "Nov 22, 2025", time: "10:00 – 13:00", label: "Weekend slot" },
                ].map((slot) => (
                  <button key={slot.id} className="cr-slot-btn" onClick={() => navigate(-1)}>
                    <div className="cr-slot-left">
                      <span className="cr-slot-date">{slot.date}</span>
                      <span className="cr-slot-time">{slot.time}</span>
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

        {/* Right column: Conflict Details */}
        {displayHasConflict && (
          <div className="cr-col-side">
            <div className="cr-conflicts-wrapper">
              <h2 className="cr-conflicts-title">Detected Clashes</h2>
              <p className="cr-conflicts-sub">
                The following existing items overlap with your proposed event.
              </p>
              <div className="cr-conflicts-list">
                {displayConflicts.map((c) => (
                  <ConflictCard key={c.id} conflict={c} />
                ))}
              </div>

              <div className="cr-action-box">
                <h3 className="cr-action-title">Proceed Anyway?</h3>
                <p className="cr-action-desc">
                  You can submit this event despite the conflicts, but it will be marked as high-risk and may be rejected by the administrator.
                </p>
                <button
                  className="cr-btn-danger-outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Submit for Admin Review
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
