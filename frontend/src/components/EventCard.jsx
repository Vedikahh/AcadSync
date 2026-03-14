import "./EventCard.css";

const STATUS_LABELS = {
  pending: { label: "Pending", cls: "badge-pending" },
  approved: { label: "Approved", cls: "badge-approved" },
  rejected: { label: "Rejected", cls: "badge-rejected" },
};

export default function EventCard({ event, isAdmin, onApprove, onReject, onDelete }) {
  const status = STATUS_LABELS[event.status] || STATUS_LABELS.pending;

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
          <span>{event.organizer || "Unknown"}</span>
        </div>
      </div>

      {isAdmin && event.status === "pending" && (
        <div className="event-actions">
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
        </div>
      )}

      {!isAdmin && event.status === "pending" && onDelete && (
        <div className="event-actions">
          <button className="btn-delete" onClick={() => onDelete(event.id)}>
            Delete Request
          </button>
        </div>
      )}
    </div>
  );
}
