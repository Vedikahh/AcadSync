import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationItem from "../components/NotificationItem";
import "./NotificationsPage.css";

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: "approval",
    message: "Your event \"Annual Tech Fest 2025\" has been approved! Congratulations.",
    read: false,
    link: "/events",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 2,
    type: "reminder",
    message: "Reminder: Tech Fest is in 3 days. Complete all pre-event arrangements.",
    read: false,
    link: "/events",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 3,
    type: "announcement",
    message: "New academic calendar for 2025-26 has been released by the administration.",
    read: false,
    link: "/schedule",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 4,
    type: "rejection",
    message: "Your event request \"Night Concert\" was not approved. Contact admin for details.",
    read: true,
    link: "/events",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 5,
    type: "event",
    message: "Hackathon 2025 registrations are now open. Deadline: Oct 15.",
    read: true,
    link: "/events",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 6,
    type: "system",
    message: "Your AcadSync account details have been updated successfully.",
    read: true,
    link: "/profile",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 7,
    type: "conflict",
    message: "Conflict detected: Annual Tech Fest overlaps with DSA Lecture on Nov 15.",
    read: false,
    link: "/conflict",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const clearAll = () => setNotifications([]);

  const handleClick = (notif) => {
    // Mark as read
    if (!notif.read) markRead(notif.id);
    // Navigate to the linked page
    if (notif.link) navigate(notif.link);
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read")   return n.read;
    return true;
  });

  return (
    <div className="notif-page-bg">
      <div className="notif-page-container">
        
        {/* Page Header */}
        <div className="np-header">
          <div className="np-header-title">
            <h1>Inbox</h1>
            {unreadCount > 0 && (
              <span className="np-unread-badge">{unreadCount} new</span>
            )}
          </div>
          <p className="np-header-sub">Manage your alerts and system messages.</p>
        </div>

        {/* Action Bar */}
        <div className="np-action-bar">
          <div className="np-filters">
            {["all", "unread", "read"].map((f) => (
              <button
                key={f}
                className={`np-filter-btn ${filter === f ? "np-filter-active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "unread" && unreadCount > 0 && (
                  <span className="np-filter-count">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="np-bulk-actions">
            {unreadCount > 0 && (
              <button className="np-btn-ghost np-text-primary" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button className="np-btn-ghost np-text-danger" onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Notifications Grid */}
        <div className="np-content-area">
          {filtered.length === 0 ? (
            <div className="np-empty-state">
              <div className="np-empty-icon">✓</div>
              <h3 className="np-empty-title">You're all caught up</h3>
              <p className="np-empty-desc">
                {filter === "unread"
                  ? "There are no new unread notifications right now."
                  : "Your inbox is completely empty."}
              </p>
            </div>
          ) : (
            <div className="np-list-wrapper">
              {filtered.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={markRead}
                  onClick={handleClick}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
