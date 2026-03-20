import "./EventModal.css";

export default function EventModal({ event, onClose }) {
  if (!event) return null;

  const formatDate = (rawDate) => {
    if (!rawDate) return "TBA";

    const dateValue = new Date(rawDate);
    if (Number.isNaN(dateValue.getTime())) {
      return "TBA";
    }

    return dateValue.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime12h = (time) => {
    if (!time) return "TBD";

    const timeMatch = String(time).match(/^(\d{1,2}):(\d{2})/);
    if (!timeMatch) return time;

    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);

    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
      return time;
    }

    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const statusCls = event.status === "approved" ? "em-badge-appr"
                  : event.status === "rejected" ? "em-badge-rej"
                  : "em-badge-pend";
                  
  const formattedDate = formatDate(event.date);
  const participants = event.participants ?? event.expectedParticipants;

  return (
    <div className="em-overlay" onClick={onClose}>
      <div className="em-modal" onClick={e => e.stopPropagation()}>
        <button className="em-close" onClick={onClose} aria-label="Close modal">✕</button>
        
        <div className="em-header">
          <span className={`em-status-badge ${statusCls}`}>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </span>
          <h2 className="em-title">{event.title}</h2>
          <p className="em-org">Organized by: {event.organizer || event.createdBy?.name || "Unknown"} {event.department ? `(${event.department})` : ""}</p>
        </div>

        <div className="em-body">
          <div className="em-section">
            <h3 className="em-section-title">About this event</h3>
            <p className="em-desc">{event.description || "No description provided."}</p>
          </div>

          <div className="em-grid">
            <div className="em-detail-item">
              <span className="em-icon">📅</span>
              <div>
                <span className="em-label">Date</span>
                <span className="em-value">{formattedDate}</span>
              </div>
            </div>
            
            <div className="em-detail-item">
              <span className="em-icon">⏰</span>
              <div>
                <span className="em-label">Time</span>
                <span className="em-value">{formatTime12h(event.startTime)} - {formatTime12h(event.endTime)}</span>
              </div>
            </div>
            
            <div className="em-detail-item">
              <span className="em-icon">📍</span>
              <div>
                <span className="em-label">Venue</span>
                <span className="em-value">{event.venue || "To be announced"}</span>
              </div>
            </div>
            
            <div className="em-detail-item">
              <span className="em-icon">👥</span>
              <div>
                <span className="em-label">Expected Participants</span>
                <span className="em-value">{participants ? participants : "Unspecified"}</span>
              </div>
            </div>
          </div>
          
          {(event.equipments || event.resources) && (
            <div className="em-section em-resources">
              <h3 className="em-section-title">Requested Resources</h3>
              <p className="em-value">{event.equipments || event.resources}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
