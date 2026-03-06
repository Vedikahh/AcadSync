import "./NotificationItem.css";

const TYPE_ICONS = {
  event: "📅",
  approval: "✅",
  rejection: "❌",
  announcement: "📢",
  reminder: "⏰",
  system: "⚙️",
};

export default function NotificationItem({ notification, onMarkRead }) {
  const icon = TYPE_ICONS[notification.type] || "🔔";
  const timeAgo = getTimeAgo(notification.created_at);

  return (
    <div
      className={`notification-item ${notification.read ? "read" : "unread"}`}
      onClick={() => !notification.read && onMarkRead && onMarkRead(notification.id)}
    >
      <div className="notif-icon">{icon}</div>
      <div className="notif-content">
        <p className="notif-message">{notification.message}</p>
        <span className="notif-time">{timeAgo}</span>
      </div>
      {!notification.read && <span className="unread-dot" />}
    </div>
  );
}

function getTimeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
