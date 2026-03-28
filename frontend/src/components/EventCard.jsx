import { useEffect, useState } from "react";
import "./EventCard.css";
import {
  Calendar,
  Clock3,
  MapPin,
  User,
  Users,
  ArrowUpRight,
  CheckCircle,
  XCircle,
} from "lucide-react";

const STATUS_LABELS = {
  pending: { label: "Pending", cls: "pending" },
  approved: { label: "Approved", cls: "approved" },
  rejected: { label: "Rejected", cls: "rejected" },
};

export default function EventCard({
  event,
  user,
  isAdmin,
  onApprove,
  onReject,
  onDelete,
  onEdit,
  onClick,
  animationIndex = 0,
}) {
  const status = STATUS_LABELS[event.status] || STATUS_LABELS.pending;
  const [countdown, setCountdown] = useState("");

  // Ownership check: createdBy might be populated object or just ID string
  const createdById = event.createdBy?._id || event.createdBy;
  const isOwner = user?.id === createdById;

  useEffect(() => {
    const getEventStart = () => {
      if (!event?.date) return null;
      const time = event.startTime || "00:00";
      const stamp = `${event.date}T${time}`;
      const parsed = new Date(stamp);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const formatCountdown = () => {
      const start = getEventStart();
      if (!start) return "";

      const diffMs = start.getTime() - Date.now();
      if (diffMs <= 0) return "Started";

      const totalMinutes = Math.floor(diffMs / 60000);
      const days = Math.floor(totalMinutes / (24 * 60));
      const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
      const mins = totalMinutes % 60;

      if (days > 0) return `Starts in ${days}d ${hours}h`;
      if (hours > 0) return `Starts in ${hours}h ${mins}m`;
      return `Starts in ${mins}m`;
    };

    setCountdown(formatCountdown());
    const timer = setInterval(() => setCountdown(formatCountdown()), 30000);
    return () => clearInterval(timer);
  }, [event?.date, event?.startTime]);

  const eventDate = event.date
    ? new Date(event.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBD";

  const eventTime = event.startTime && event.endTime
    ? `${event.startTime} - ${event.endTime}`
    : event.startTime || "Time not set";

  return (
    <div
      className={`event-card ${onClick ? "event-card-clickable" : ""}`}
      style={{ "--item-index": animationIndex }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="event-card-header">
        <h3 className="event-title">{event.title}</h3>
        <div className={`status-badge status-${status.cls}`}>
          <span className="status-dot"></span>
          {status.label}
        </div>
      </div>

      <p className="event-description">{event.description}</p>

      <div className="event-pill-row">
        <span className="event-pill event-pill-soft">
          <Clock3 size={14} /> {eventTime}
        </span>
        <span className="event-pill event-pill-soft">
          <Calendar size={14} /> {eventDate}
        </span>
      </div>

      <div className="event-meta">
        <div className="meta-item">
          <MapPin size={16} className="meta-icon" />
          <span>{event.venue || "To be announced"}</span>
        </div>
        <div className="meta-item">
          <User size={16} className="meta-icon" />
          <span>{event.createdBy?.name || event.organizer || "Unknown"}</span>
        </div>
        {event.participants ? (
          <div className="meta-item">
            <Users size={16} className="meta-icon" />
            <span>{event.participants} participants</span>
          </div>
        ) : null}
        {countdown && (
          <div
            className="meta-item event-countdown status-transition"
            title="Auto-updates as event start time approaches"
          >
            <span>{countdown}</span>
          </div>
        )}
      </div>

      {onClick && (
        <div className="event-card-cta" aria-hidden="true">
          <span>View details</span>
          <ArrowUpRight size={16} />
        </div>
      )}

      {(isAdmin || isOwner) && (
        <div className="event-actions" onClick={(e) => e.stopPropagation()}>
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
                <button
                  className="btn-delete"
                  onClick={() => onDelete(event._id || event.id)}
                >
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
