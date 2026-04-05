import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationsContext";
import { useAuth } from "../context/AuthContext";
import NotificationItem from "../components/NotificationItem";
import "./NotificationsPage.css";

const ANNOUNCEMENT_DEPARTMENTS = ["COMPS", "AIML", "AIDS", "IOT", "Mechanical"];

export default function NotificationsPage() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllRead,
    fetchNextPage,
    pagination,
    isLoading,
    deleteNotification,
    clearReadNotifications,
    createAnnouncement,
    previewAnnouncementAudience,
  } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishSuccess, setPublishSuccess] = useState("");
  const [inboxActionError, setInboxActionError] = useState("");
  const [audiencePreviewLoading, setAudiencePreviewLoading] = useState(false);
  const [audiencePreviewError, setAudiencePreviewError] = useState("");
  const [audiencePreview, setAudiencePreview] = useState({
    targetCount: 0,
    sampleRecipients: [],
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    audienceType: "all",
    role: "student",
    department: ANNOUNCEMENT_DEPARTMENTS[0],
    priority: "normal",
  });
  const navigate = useNavigate();
  const canPublishAnnouncement = user?.role === "admin" || user?.role === "organizer";

  useEffect(() => {
    // Initial fetch handled by context, but we can call it again if we want fresh data on mount
    fetchNotifications({ page: 1 });
  }, [fetchNotifications]);

  const handleClick = (notif) => {
    const id = notif._id || notif.id;
    if (!notif.read) markAsRead(id);
    if (notif.link) navigate(notif.link);
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read")   return n.read;
    return true;
  });
  const readCount = notifications.length - unreadCount;

  const handleDeleteNotification = async (id) => {
    try {
      setInboxActionError("");
      await deleteNotification(id);
    } catch (error) {
      setInboxActionError(error.message || "Failed to delete notification.");
    }
  };

  const handleClearRead = async () => {
    try {
      setInboxActionError("");
      await clearReadNotifications();
    } catch (error) {
      setInboxActionError(error.message || "Failed to clear read notifications.");
    }
  };

  const handleAnnouncementChange = (event) => {
    const { name, value } = event.target;
    setPublishError("");
    setPublishSuccess("");
    setAnnouncementForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!canPublishAnnouncement) return;

    const payload = { audienceType: announcementForm.audienceType };
    if (announcementForm.audienceType === "role") payload.role = announcementForm.role;
    if (announcementForm.audienceType === "department") payload.department = announcementForm.department;

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setAudiencePreviewLoading(true);
        setAudiencePreviewError("");
        const data = await previewAnnouncementAudience(payload);
        if (!active) return;
        setAudiencePreview({
          targetCount: data?.targetCount || 0,
          sampleRecipients: Array.isArray(data?.sampleRecipients) ? data.sampleRecipients : [],
        });
      } catch (error) {
        if (!active) return;
        setAudiencePreviewError(error.message || "Could not preview recipients.");
        setAudiencePreview({ targetCount: 0, sampleRecipients: [] });
      } finally {
        if (active) setAudiencePreviewLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    canPublishAnnouncement,
    announcementForm.audienceType,
    announcementForm.role,
    announcementForm.department,
    previewAnnouncementAudience,
  ]);

  const handleAnnouncementSubmit = async (event) => {
    event.preventDefault();
    setPublishError("");
    setPublishSuccess("");

    const title = announcementForm.title.trim();
    const content = announcementForm.content.trim();

    if (title.length < 3) {
      setPublishError("Title must be at least 3 characters.");
      return;
    }
    if (content.length < 5) {
      setPublishError("Message must be at least 5 characters.");
      return;
    }

    const payload = {
      title,
      content,
      audienceType: announcementForm.audienceType,
      priority: announcementForm.priority,
    };

    if (announcementForm.audienceType === "role") {
      payload.role = announcementForm.role;
    }
    if (announcementForm.audienceType === "department") {
      payload.department = announcementForm.department;
    }

    try {
      setIsPublishing(true);
      const result = await createAnnouncement(payload);
      setAnnouncementForm((prev) => ({
        ...prev,
        title: "",
        content: "",
      }));
      setPublishSuccess(`Announcement published to ${result?.createdCount ?? 0} recipient(s).`);
    } catch (error) {
      setPublishError(error.message || "Failed to publish announcement.");
    } finally {
      setIsPublishing(false);
    }
  };

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
            {readCount > 0 && (
              <button className="np-btn-ghost np-text-danger" onClick={handleClearRead}>
                Clear read
              </button>
            )}
          </div>
        </div>

        {inboxActionError && <p className="np-feedback np-feedback-error">{inboxActionError}</p>}

        {canPublishAnnouncement && (
          <form className="np-announcement-panel" onSubmit={handleAnnouncementSubmit}>
            <div className="np-announcement-head">
              <h2>Publish Announcement</h2>
              <span>Visible from this notifications inbox</span>
            </div>

            <div className="np-announcement-grid">
              <label className="np-announcement-field">
                <span>Title</span>
                <input
                  type="text"
                  name="title"
                  value={announcementForm.title}
                  onChange={handleAnnouncementChange}
                  placeholder="Semester orientation update"
                  maxLength={160}
                  required
                />
              </label>

              <label className="np-announcement-field">
                <span>Audience</span>
                <select
                  name="audienceType"
                  value={announcementForm.audienceType}
                  onChange={handleAnnouncementChange}
                >
                  <option value="all">All users</option>
                  <option value="role">By role</option>
                  <option value="department">By department</option>
                </select>
              </label>

              <label className="np-announcement-field">
                <span>Priority</span>
                <select
                  name="priority"
                  value={announcementForm.priority}
                  onChange={handleAnnouncementChange}
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>

              {announcementForm.audienceType === "role" && (
                <label className="np-announcement-field">
                  <span>Role</span>
                  <select name="role" value={announcementForm.role} onChange={handleAnnouncementChange}>
                    <option value="student">Student</option>
                    <option value="organizer">Organizer</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              )}

              {announcementForm.audienceType === "department" && (
                <label className="np-announcement-field">
                  <span>Department</span>
                  <select
                    name="department"
                    value={announcementForm.department}
                    onChange={handleAnnouncementChange}
                  >
                    {ANNOUNCEMENT_DEPARTMENTS.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <label className="np-announcement-field np-announcement-message">
              <span>Message</span>
              <textarea
                name="content"
                value={announcementForm.content}
                onChange={handleAnnouncementChange}
                rows={4}
                maxLength={2000}
                placeholder="Share exam updates, venue changes, or deadlines."
                required
              />
            </label>

            <div className="np-preview-box" role="status" aria-live="polite">
              <p className="np-preview-title">Audience preview</p>
              {audiencePreviewLoading ? (
                <p className="np-preview-meta">Calculating recipients...</p>
              ) : audiencePreviewError ? (
                <p className="np-preview-meta np-feedback-error">{audiencePreviewError}</p>
              ) : (
                <>
                  <p className="np-preview-meta">Estimated recipients: {audiencePreview.targetCount}</p>
                  {audiencePreview.sampleRecipients.length > 0 && (
                    <p className="np-preview-sample">
                      Sample: {audiencePreview.sampleRecipients.map((item) => item.name).join(", ")}
                    </p>
                  )}
                </>
              )}
            </div>

            {publishError && <p className="np-feedback np-feedback-error">{publishError}</p>}
            {publishSuccess && <p className="np-feedback np-feedback-success">{publishSuccess}</p>}

            <div className="np-announcement-actions">
              <button type="submit" className="np-btn-primary" disabled={isPublishing}>
                {isPublishing ? "Publishing..." : "Publish announcement"}
              </button>
            </div>
          </form>
        )}

        {/* Notifications Grid */}
        <div className="np-content-area">
          {isLoading ? (
            <div className="np-skeleton-list" role="status" aria-live="polite" aria-label="Loading notification data">
              <div className="app-skeleton np-skeleton-item" />
              <div className="app-skeleton np-skeleton-item" />
              <div className="app-skeleton np-skeleton-item" />
              <div className="app-skeleton np-skeleton-item" />
            </div>
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
              {filtered.map((n, index) => {
                const normalizedNotif = { ...n, id: n._id || n.id };
                return (
                  <NotificationItem
                    key={normalizedNotif.id}
                    notification={normalizedNotif}
                    animationIndex={index}
                    onMarkRead={() => markAsRead(normalizedNotif.id)}
                    onDelete={() => handleDeleteNotification(normalizedNotif.id)}
                    onClick={() => handleClick(normalizedNotif)}
                  />
                )
              })}
              {filter === "all" && pagination?.hasNextPage && (
                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                  <button className="np-btn-ghost np-text-primary" onClick={fetchNextPage}>
                    Load more
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
