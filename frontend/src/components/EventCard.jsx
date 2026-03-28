import "./EventCard.css";
import { Calendar, MapPin, User, CheckCircle, XCircle } from "lucide-react";

const STATUS_LABELS = {
  pending: { label: "Pending", cls: "pending" },
  approved: { label: "Approved", cls: "approved" },
  rejected: { label: "Rejected", cls: "rejected" },
};

export default function EventCard({ event, user, isAdmin, onApprove, onReject, onDelete, onEdit, onClick }) {
  const status = STATUS_LABELS[event.status] || STATUS_LABELS.pending;
  
  // Ownership check: createdBy might be populated object or just ID string
  const createdById = event.createdBy?._id || event.createdBy;
  const isOwner = user?.id === createdById;

  return (
    <div 
      className={`event-card ${onClick ? "event-card-clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="event-card-header">
        <h3 className="event-title">{event.title}</h3>
        <div className={`status-badge status-${status.cls}`}>
          <span className="status-dot"></span>
          {status.label}
        </div>
      </div>

      <p className="event-description">{event.description}</p>

      <div className="event-meta">
        <div className="meta-item">
          <Calendar size={16} className="meta-icon" />
          <span>{event.date ? new Date(event.date).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
          }) : "TBD"}</span>
        </div>
        <div className="meta-item">
          <MapPin size={16} className="meta-icon" />
          <span>{event.venue || "To be announced"}</span>
        </div>
        <div className="meta-item">
          <User size={16} className="meta-icon" />
          <span>{event.createdBy?.name || event.organizer || "Unknown"}</span>
        </div>
      </div>

      {(isAdmin || isOwner) && (
        <div className="event-actions" onClick={e => e.stopPropagation()}>
          {isAdmin && event.status === "pending" && (
            <>
              <button
                className="btn-approve"
                onClick={() => onApprove && onApprove(event._id || event.id)}
              >
                <CheckCircle size={16} /> Approve
              </button>
              <button
                className="btn-reject"
                onClick={() => onReject && onReject(event._id || event.id)}
              >
                <XCircle size={16} /> Reject
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
                 <button className="btn-delete" onClick={() => onDelete(event._id || event.id)}>
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
