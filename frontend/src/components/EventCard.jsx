import "./EventCard.css";

const STATUS_LABELS = {
  pending: { label: "Pending", cls: "badge-pending" },
  approved: { label: "Approved", cls: "badge-approved" },
  rejected: { label: "Rejected", cls: "badge-rejected" },
  cancelled: { label: "Cancelled", cls: "badge-cancelled" },
  completed: { label: "Completed", cls: "badge-completed" },
};

export default function EventCard({ event, user, isAdmin, onApprove, onReject, onCancel, onDelete, onEdit, onClick }) {
  const effectiveStatus = event.isCompleted && event.status === "approved" ? "completed" : event.status;
  const status = STATUS_LABELS[effectiveStatus] || STATUS_LABELS.pending;
  
  // Ownership check: createdBy might be populated object or just ID string
  const createdById = event.createdBy?._id || event.createdBy;
  const isOwner = user?.id === createdById;
  const eventDate = event.date ? new Date(event.date) : null;
  const dateMonth = eventDate
    ? eventDate.toLocaleDateString("en-IN", { month: "short" }).toUpperCase()
    : "TBD";
  const dateDay = eventDate ? eventDate.toLocaleDateString("en-IN", { day: "2-digit" }) : "--";
  const dateFull = eventDate
    ? eventDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "To be announced";
  const timeFull = event.startTime
    ? `${event.startTime}${event.endTime ? ` - ${event.endTime}` : ""}`
    : "Time TBA";
  const categoryLabel = event.category || "Campus Event";
  const organizerLabel = event.createdBy?.name || event.organizer || "Unknown";
  const handlePrimaryClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <div 
      className={`event-card ${event.status} ${onClick ? "event-card-clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
    >
      <div className="event-card-top-row">
        <div className="event-date-pill" aria-label={dateFull}>
          <span className="event-date-month">{dateMonth}</span>
          <span className="event-date-day">{dateDay}</span>
        </div>

        <div className="event-card-header">
          <div className="event-card-chips">
            <span className="event-chip event-chip-category">{categoryLabel}</span>
            <span className={`badge ${status.cls}`}>{status.label}</span>
          </div>
          <h3 className="event-title">{event.title}</h3>
        </div>
      </div>

      <p className="event-description">{event.description || "No description provided yet."}</p>

      <div className="event-meta-grid">
        <div className="meta-item meta-item-date">
          <span className="meta-label">Date</span>
          <span className="meta-value">{dateFull}</span>
        </div>
        <div className="meta-item meta-item-time">
          <span className="meta-label">Time</span>
          <span className="meta-value">{timeFull}</span>
        </div>
        <div className="meta-item meta-item-venue">
          <span className="meta-label">Venue</span>
          <span className="meta-value">{event.venue || "To be announced"}</span>
        </div>
        <div className="meta-item meta-item-organizer">
          <span className="meta-label">Organizer</span>
          <span className="meta-value">{organizerLabel}</span>
        </div>
      </div>

      {onClick && (
        <div className="event-primary-action" onClick={(e) => e.stopPropagation()}>
          <button className="btn-view-event" onClick={handlePrimaryClick}>
            View Details
          </button>
        </div>
      )}

      {(isAdmin || isOwner) && (
        <div className="event-actions" onClick={e => e.stopPropagation()}>
          {isAdmin && event.status === "pending" && (
            <>
              <button
                className="btn-approve"
                onClick={() => onApprove && onApprove(event.id)}
              >
                ✓ Approve
              </button>
              <button
                className="btn-reject"
                onClick={() => onReject && onReject(event.id)}
              >
                ✗ Reject
              </button>
            </>
          )}

          {isAdmin && event.status === "approved" && !event.isCompleted && (
            <button
              className="btn-cancel"
              onClick={() => onCancel && onCancel(event.id)}
            >
              Cancel
            </button>
          )}
          
          {(isAdmin || isOwner) && (
             <div className="owner-actions">
               {onEdit && (
                 <button className="btn-edit" onClick={() => onEdit(event)}>
                   Edit
                 </button>
               )}
               {onDelete && (
                 <button className="btn-delete" onClick={() => onDelete(event.id)}>
                   Delete
                 </button>
               )}
             </div>
          )}
        </div>
      )}
    </div>
  );
}

