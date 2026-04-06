import { useEffect, useRef } from "react";
import { formatTime12h } from "../utils/formatTime";
import { formatEventDateLong, DATE_FALLBACK_TEXT } from "../utils/formatDate";
import "./EventModal.css";

export default function EventModal({ event, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!event) return null;

  const statusCls = event.status === "approved" ? "em-badge-appr"
                  : event.status === "rejected" ? "em-badge-rej"
                  : "em-badge-pend";
                  
  const formattedDate = formatEventDateLong(event.date, DATE_FALLBACK_TEXT);
  const participants = event.participants ?? event.expectedParticipants;
  const reviewedAt = event.reviewedAt ? new Date(event.reviewedAt) : null;
  const hasReviewDate = reviewedAt && !Number.isNaN(reviewedAt.getTime());

  return (
    <div className="em-overlay" onClick={onClose}>
      <div
        className="em-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        aria-describedby="event-modal-description"
      >
        <button ref={closeButtonRef} className="em-close" onClick={onClose} aria-label="Close event details">✕</button>
        
        <div className="em-header">
          <span className={`em-status-badge ${statusCls}`}>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </span>
          <h2 id="event-modal-title" className="em-title">{event.title}</h2>
          <p className="em-org">Organized by: {event.organizer || event.createdBy?.name || "Unknown"} {event.department ? `(${event.department})` : ""}</p>
        </div>

        <div className="em-body">
          <div className="em-section">
            <h3 className="em-section-title">About this event</h3>
            <p id="event-modal-description" className="em-desc">{event.description || "No description provided."}</p>
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

          {(event.adminReviewNote || event.rejectionReason || event.reviewedBy || hasReviewDate) && (
            <div className="em-section em-resources">
              <h3 className="em-section-title">Review Details</h3>
              {event.rejectionReason && (
                <p className="em-value"><strong>Rejection reason:</strong> {event.rejectionReason}</p>
              )}
              {event.adminReviewNote && (
                <p className="em-value"><strong>Admin note:</strong> {event.adminReviewNote}</p>
              )}
              {event.reviewedBy && (
                <p className="em-value"><strong>Reviewed by:</strong> {event.reviewedBy.name || event.reviewedBy.email || "Admin"}</p>
              )}
              {hasReviewDate && (
                <p className="em-value"><strong>Reviewed at:</strong> {reviewedAt.toLocaleString("en-IN")}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
