import "./EventCard.css";

const STATUS_LABELS = {
  pending: { label: "Pending", cls: "badge-pending" },
  approved: { label: "Approved", cls: "badge-approved" },
  rejected: { label: "Rejected", cls: "badge-rejected" },
};

export default function EventCard({ event, user, isAdmin, onApprove, onReject, onDelete, onEdit }) {
  const status = STATUS_LABELS[event.status] || STATUS_LABELS.pending;
  
  // Ownership check: createdBy might be populated object or just ID string
  const createdById = event.createdBy?._id || event.createdBy;
  const isOwner = user?.id === createdById;

  return (
    <div className={`event-card ${event.status}`}>
      <div className="event-card-header">
        <h3 className="event-title">{event.title}</h3>
        <span className={`badge ${status.cls}`}>{status.label}</span>
      </div>

      <p className="event-description">{event.description}</p>

      <div className="event-meta">
        <div className="meta-item">
          <span className="meta-icon">📅</span>
          <span>{event.date ? new Date(event.date).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
          }) : "TBD"}</span>
        </div>
        <div className="meta-item">
          <span className="meta-icon">📍</span>
          <span>{event.venue || "To be announced"}</span>
        </div>
        <div className="meta-item">
          <span className="meta-icon">👤</span>
          <span>{event.createdBy?.name || event.organizer || "Unknown"}</span>
        </div>
      </div>

      {(isAdmin || isOwner) && (
        <div className="event-actions">
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
