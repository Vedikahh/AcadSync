import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile } from "../services/api";
import "./UserProfile.css";

const DEPARTMENTS = [
  "COMPS", "AIML", "AIDS", "IOT", "Mechanical",
];

function Toast({ message, onDone }) {
  return message ? <div className="up-toast" onAnimationEnd={onDone}>{message}</div> : null;
}

const DEFAULT_NOTIFICATION_PREFERENCES = {
  event: true,
  approval: true,
  rejection: true,
  reminder: true,
};

const DEFAULT_EMAIL_PREFERENCES = {
  enabled: true,
  event: true,
  approval: true,
  rejection: true,
  reminder: true,
};

export default function UserProfile() {
  const { user, login } = useAuth();

  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    department: user?.department || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
    notificationPreferences: {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(user?.notificationPreferences || {}),
    },
    emailPreferences: {
      ...DEFAULT_EMAIL_PREFERENCES,
      ...(user?.emailPreferences || {}),
    },
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const handleEditChange = (e) =>
    setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePreferenceToggle = (key) => {
    setEditForm((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: !prev.notificationPreferences[key],
      },
    }));
  };

  const handleEmailPreferenceToggle = (key) => {
    setEditForm((prev) => ({
      ...prev,
      emailPreferences: {
        ...prev.emailPreferences,
        [key]: !prev.emailPreferences[key],
      },
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image size should be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEditForm((p) => ({ ...p, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setEditForm((p) => ({ ...p, avatar: "" }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    try {
      setLoading(true);
      const updated = await updateUserProfile(editForm);
      login({ ...user, ...updated });
      showToast("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="up-page">
      <Toast message={toast} />
      <div className="up-container">
        <div className="up-panel">
          <div className="up-panel-header">
            <h2>My Profile</h2>
            <p>Update only the details that are currently supported.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="up-form">
            <div className="up-avatar-row">
              <div className={`up-avatar up-avatar-${user?.role || "student"}`}>
                {editForm.avatar ? (
                  <img src={editForm.avatar} alt="Profile" className="up-avatar-image" />
                ) : (
                  initials
                )}
              </div>

              <div className="up-avatar-actions">
                <label htmlFor="avatarUpload" className="up-btn-secondary">Upload Photo</label>
                <input
                  id="avatarUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="up-file-input"
                />
                {editForm.avatar && (
                  <button type="button" className="up-btn-link" onClick={handleRemoveAvatar}>
                    Remove
                  </button>
                )}
                <span className="up-hint">PNG/JPG up to 2MB.</span>
              </div>
            </div>

            <div className="up-form-grid">
              <div className="up-field">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={editForm.name}
                  onChange={handleEditChange}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="up-field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={user?.email || ""} disabled className="up-input-disabled" />
              </div>
            </div>

            <div className="up-field">
              <label htmlFor="department">Department</label>
              <select id="department" name="department" value={editForm.department} onChange={handleEditChange}>
                <option value="">- Not specified -</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="up-field">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                placeholder="Short bio"
                value={editForm.bio}
                onChange={handleEditChange}
              />
            </div>

            <div className="up-pref-section">
              <h3>Notification Preferences</h3>
              <p>Choose which alerts you want to receive.</p>
              <div className="up-pref-grid">
                {[
                  ["event", "New event requests"],
                  ["approval", "Event approvals"],
                  ["rejection", "Event rejections"],
                  ["reminder", "Event reminders"],
                ].map(([key, label]) => (
                  <label key={key} className="up-pref-item">
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.notificationPreferences?.[key])}
                      onChange={() => handlePreferenceToggle(key)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="up-pref-section">
              <h3>Email Notifications</h3>
              <p>Receive notifications via email for selected events.</p>
              <label className="up-pref-item up-pref-master">
                <input
                  type="checkbox"
                  checked={Boolean(editForm.emailPreferences?.enabled)}
                  onChange={() => handleEmailPreferenceToggle("enabled")}
                />
                <span><strong>Enable email notifications</strong></span>
              </label>
              {editForm.emailPreferences?.enabled && (
                <div className="up-pref-grid" style={{ marginTop: "12px" }}>
                  {[
                    ["event", "New events in my department"],
                    ["approval", "Event approvals"],
                    ["rejection", "Event rejections"],
                    ["reminder", "Reminders 24h before events"],
                  ].map(([key, label]) => (
                    <label key={key} className="up-pref-item">
                      <input
                        type="checkbox"
                        checked={Boolean(editForm.emailPreferences?.[key])}
                        onChange={() => handleEmailPreferenceToggle(key)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="up-form-footer">
              <button type="submit" className="up-btn-primary" disabled={loading}>
                {loading ? <><span className="up-spinner" /> Saving...</> : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
