import { useState } from "react";
import NotificationItem from "../components/NotificationItem";
import "./NotificationsPage.css";

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: "approval",
    message: "Your event \"Annual Tech Fest 2025\" has been approved! Congratulations.",
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 2,
    type: "reminder",
    message: "Reminder: Tech Fest is in 3 days. Complete all pre-event arrangements.",
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 3,
    type: "announcement",
    message: "New academic calendar for 2025-26 has been released by the administration.",
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 4,
    type: "rejection",
    message: "Your event request \"Night Concert\" was not approved. Contact admin for details.",
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 5,
    type: "event",
    message: "Hackathon 2025 registrations are now open. Deadline: Oct 15.",
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 6,
    type: "system",
    message: "Your AcadSync account details have been updated successfully.",
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const clearAll = () => setNotifications([]);

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  return (
    <div className="notifications-page">
      <div className="notif-header">
        <div>
          <h1>
            Notifications
            {unreadCount > 0 && (
              <span className="unread-pill">{unreadCount} unread</span>
            )}
          </h1>
          <p>Stay up to date with campus activities and updates.</p>
        </div>
        <div className="notif-header-actions">
          {unreadCount > 0 && (
            <button className="btn-mark-all" onClick={markAllRead}>
              ✓ Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="btn-clear" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="notif-filters">
        {["all", "unread", "read"].map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="notif-empty">
          <span>🔔</span>
          <p>
            {filter === "unread"
              ? "No unread notifications. You're all caught up!"
              : "No notifications here."}
          </p>
        </div>
      ) : (
        <div className="notif-list">
          {filtered.map((n) => (
            <NotificationItem key={n.id} notification={n} onMarkRead={markRead} />
          ))}
        </div>
      )}
    </div>
  );
}
