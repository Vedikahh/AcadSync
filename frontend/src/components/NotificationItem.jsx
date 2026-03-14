import "./NotificationItem.css";

const TYPE_LABELS = {
  event:        "Event",
  approval:     "Approval",
  rejection:    "Rejected",
  announcement: "Notice",
  reminder:     "Reminder",
  conflict:     "Conflict",
  system:       "System",
};

const TYPE_ROUTE_HINT = {
  event:        "View events",
  approval:     "View events",
  rejection:    "View events",
  announcement: "View schedule",
  reminder:     "View events",
  conflict:     "View conflicts",
  system:       "View profile",
};

export default function NotificationItem({ notification, onMarkRead, onClick }) {
  const typeLabel = TYPE_LABELS[notification.type] || "Notice";
  const routeHint = TYPE_ROUTE_HINT[notification.type] || "Go to page";
  const timeAgo   = getTimeAgo(notification.created_at);

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    } else if (!notification.read && onMarkRead) {
      onMarkRead(notification.id);
    }
  };

  return (
    <div
      className={`notification-item ${notification.read ? "notif-read" : "notif-unread"} ${onClick ? "notif-clickable" : ""}`}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && handleClick() : undefined}
    >
      {/* Type icon circle */}
      <div className={`notif-icon notif-icon-${notification.type || "default"}`}>
        <span className="notif-type-letter">
          {typeLabel.charAt(0)}
        </span>
      </div>

      {/* Content */}
      <div className="notif-content">
        <div className="notif-meta">
          <span className={`notif-type-label notif-label-${notification.type}`}>{typeLabel}</span>
          <span className="notif-time">{timeAgo}</span>
        </div>
        <p className="notif-message">{notification.message}</p>
        {onClick && notification.link && (
          <span className="notif-route-hint">{routeHint} →</span>
        )}
      </div>

      {/* Unread dot */}
      {!notification.read && <span className="unread-dot" />}
    </div>
  );
}

function getTimeAgo(dateStr) {
  if (!dateStr) return "";
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days  = Math.floor(hours / 24);
  return `${days}d ago`;
}
