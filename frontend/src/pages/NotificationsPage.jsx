import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../services/api";
import NotificationItem from "../components/NotificationItem";
import "./NotificationsPage.css";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => ((n._id === id || n.id === id) ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = () => setNotifications([]);

  const handleClick = (notif) => {
    const id = notif._id || notif.id;
    // Mark as read
    if (!notif.read) markRead(id);
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
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>Loading notification data...</div>
          ) : filtered.length === 0 ? (
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
              {filtered.map((n) => {
                const normalizedNotif = { ...n, id: n._id || n.id };
                return (
                  <NotificationItem
                    key={normalizedNotif.id}
                    notification={normalizedNotif}
                    onMarkRead={() => markRead(normalizedNotif.id)}
                    onClick={() => handleClick(normalizedNotif)}
                  />
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
