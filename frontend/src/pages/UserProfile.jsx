import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { changeUserPassword, deleteUserAccount, updateUserProfile } from "../services/api";
import "./UserProfile.css";

const DEPARTMENTS = [
  "COMPS", "AIML", "AIDS", "IOT", "Mechanical",
];

const YEARS = [
  "",
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
  "Fifth Year",
  "Postgraduate",
];

const NOTIFICATION_TYPES = [
  ["event", "New event requests"],
  ["approval", "Event approvals"],
  ["rejection", "Event rejections"],
  ["reminder", "Event reminders"],
];

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

function Toast({ message, onDone }) {
  return message ? <div className="up-toast" onAnimationEnd={onDone}>{message}</div> : null;
}

const DEFAULT_NOTIFICATION_CHANNELS = {
  event: { inApp: true, email: true },
  approval: { inApp: true, email: true },
  rejection: { inApp: true, email: true },
  reminder: { inApp: true, email: true },
};

const normalizeNotificationChannels = (user = {}) => {
  const legacyNotification = user.notificationPreferences || {};
  const legacyEmail = user.emailPreferences || {};
  const emailGloballyEnabled = legacyEmail.enabled !== false;
  const channels = user.notificationChannels || {};

  return NOTIFICATION_TYPES.reduce((acc, [key]) => {
    const raw = channels[key] || {};
    const inApp = typeof raw.inApp === "boolean" ? raw.inApp : legacyNotification[key] !== false;
    const email = typeof raw.email === "boolean" ? raw.email : (emailGloballyEnabled && legacyEmail[key] !== false);

    acc[key] = { inApp, email };
    return acc;
  }, { ...DEFAULT_NOTIFICATION_CHANNELS });
};

export default function UserProfile() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const initialChannels = useMemo(() => normalizeNotificationChannels(user || {}), [user]);

  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    department: user?.department || "",
    bio: user?.bio || "",
    year: user?.year || "",
    interests: Array.isArray(user?.interests) ? user.interests.join(", ") : "",
    phone: user?.phone || "",
    alternateContact: user?.alternateContact || "",
    avatar: user?.avatar || "",
    notificationChannels: initialChannels,
  });

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordFeedback, setPasswordFeedback] = useState({ type: "", message: "" });
  const [deleteState, setDeleteState] = useState({
    confirmText: "",
    currentPassword: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const handleEditChange = (e) =>
    setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleNotificationChannelToggle = (key, channel) => {
    setEditForm((prev) => ({
      ...prev,
      notificationChannels: {
        ...prev.notificationChannels,
        [key]: {
          ...prev.notificationChannels[key],
          [channel]: !prev.notificationChannels[key]?.[channel],
        },
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
    if (file.size > MAX_AVATAR_SIZE) {
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
    if (!editForm.name.trim()) {
      showToast("Name cannot be empty.");
      return;
    }

    const interests = String(editForm.interests || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 10);

    try {
      setLoading(true);
      const updated = await updateUserProfile({
        ...editForm,
        interests,
      });
      login({ ...user, ...updated });
      showToast("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordFeedback({ type: "", message: "" });

    if (!passwordState.currentPassword || !passwordState.newPassword) {
      setPasswordFeedback({ type: "error", message: "Please fill in all required password fields." });
      return;
    }

    if (passwordState.newPassword.length < 8) {
      setPasswordFeedback({ type: "error", message: "New password must be at least 8 characters long." });
      return;
    }

    if (passwordState.newPassword !== passwordState.confirmNewPassword) {
      setPasswordFeedback({ type: "error", message: "New password and confirmation do not match." });
      return;
    }

    try {
      setPasswordLoading(true);
      await changeUserPassword(passwordState);
      setPasswordState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setPasswordFeedback({ type: "success", message: "Password changed successfully." });
    } catch (err) {
      setPasswordFeedback({ type: "error", message: err.message || "Failed to change password." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteFeedback("");

    if (deleteState.confirmText !== "DELETE") {
      setDeleteFeedback("Type DELETE exactly to confirm account deletion.");
      return;
    }

    if (isLocalUser && !deleteState.currentPassword) {
      setDeleteFeedback("Current password is required for local accounts.");
      return;
    }

    try {
      setDeleteLoading(true);
      await deleteUserAccount({
        confirmText: deleteState.confirmText,
        currentPassword: deleteState.currentPassword,
      });
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setDeleteFeedback(err.message || "Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const isLocalUser = (user?.provider || "local") === "local";

  return (
    <div className="up-page">
      <Toast message={toast} />
      <div className="up-container">
        <div className="up-panel">
          <div className="up-panel-header">
            <h2>My Profile</h2>
            <p>Manage personal details, notification channels, and account security.</p>
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

            <div className="up-form-grid">
              <div className="up-field">
                <label htmlFor="year">Academic Year</label>
                <select id="year" name="year" value={editForm.year} onChange={handleEditChange}>
                  {YEARS.map((yearOption) => (
                    <option key={yearOption || "unset"} value={yearOption}>
                      {yearOption || "- Not specified -"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="up-field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={editForm.phone}
                  onChange={handleEditChange}
                />
              </div>
            </div>

            <div className="up-form-grid">
              <div className="up-field">
                <label htmlFor="alternateContact">Alternate Contact</label>
                <input
                  id="alternateContact"
                  name="alternateContact"
                  type="text"
                  placeholder="Guardian / roommate contact"
                  value={editForm.alternateContact}
                  onChange={handleEditChange}
                />
              </div>
              <div className="up-field">
                <label htmlFor="interests">Interests</label>
                <input
                  id="interests"
                  name="interests"
                  type="text"
                  placeholder="Hackathons, Robotics, Design"
                  value={editForm.interests}
                  onChange={handleEditChange}
                />
                <span className="up-hint">Use commas to separate up to 10 interests.</span>
              </div>
            </div>

            <div className="up-pref-section">
              <h3>Notification Channels</h3>
              <p>Choose delivery channels for each notification type.</p>
              <div className="up-channel-table" role="table" aria-label="Notification channels">
                <div className="up-channel-row up-channel-header" role="row">
                  <span>Type</span>
                  <span>In-app</span>
                  <span>Email</span>
                </div>
                {NOTIFICATION_TYPES.map(([key, label]) => (
                  <div key={key} className="up-channel-row" role="row">
                    <span>{label}</span>
                    <label className="up-channel-check">
                      <input
                        type="checkbox"
                        checked={Boolean(editForm.notificationChannels?.[key]?.inApp)}
                        onChange={() => handleNotificationChannelToggle(key, "inApp")}
                      />
                    </label>
                    <label className="up-channel-check">
                      <input
                        type="checkbox"
                        checked={Boolean(editForm.notificationChannels?.[key]?.email)}
                        onChange={() => handleNotificationChannelToggle(key, "email")}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="up-form-footer">
              <button type="submit" className="up-btn-primary" disabled={loading}>
                {loading ? <><span className="up-spinner" /> Saving...</> : "Save"}
              </button>
            </div>
          </form>

          <div className="up-security-section">
            <h3>Security</h3>
            <p>
              {isLocalUser
                ? "Update your password to keep your account secure."
                : "Password changes are managed by your social sign-in provider."}
            </p>

            {isLocalUser ? (
              <form className="up-password-form" onSubmit={handlePasswordChange}>
                <div className="up-form-grid">
                  <div className="up-field">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={passwordState.currentPassword}
                      onChange={(e) => setPasswordState((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="up-field">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      id="newPassword"
                      type="password"
                      minLength={8}
                      value={passwordState.newPassword}
                      onChange={(e) => setPasswordState((prev) => ({ ...prev, newPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="up-field">
                  <label htmlFor="confirmNewPassword">Confirm New Password</label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    minLength={8}
                    value={passwordState.confirmNewPassword}
                    onChange={(e) => setPasswordState((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
                    required
                  />
                </div>

                {passwordFeedback.message && (
                  <div className={`up-inline-feedback up-inline-feedback-${passwordFeedback.type || "info"}`}>
                    {passwordFeedback.message}
                  </div>
                )}

                <div className="up-form-footer">
                  <button type="submit" className="up-btn-primary" disabled={passwordLoading}>
                    {passwordLoading ? <><span className="up-spinner" /> Updating...</> : "Change Password"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="up-inline-feedback up-inline-feedback-info">
                This account uses {user?.provider || "social"} sign-in. Update your password from that provider.
              </div>
            )}

            <div className="up-danger-zone">
              <h4>Delete Account</h4>
              <p>
                This action permanently removes your account and cannot be undone.
              </p>

              <form className="up-delete-form" onSubmit={handleDeleteAccount}>
                <div className="up-field">
                  <label htmlFor="deleteConfirm">Type DELETE to confirm</label>
                  <input
                    id="deleteConfirm"
                    type="text"
                    placeholder="DELETE"
                    value={deleteState.confirmText}
                    onChange={(e) => setDeleteState((prev) => ({ ...prev, confirmText: e.target.value }))}
                    required
                  />
                </div>

                {isLocalUser && (
                  <div className="up-field">
                    <label htmlFor="deletePassword">Current Password</label>
                    <input
                      id="deletePassword"
                      type="password"
                      value={deleteState.currentPassword}
                      onChange={(e) => setDeleteState((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                  </div>
                )}

                {deleteFeedback && (
                  <div className="up-inline-feedback up-inline-feedback-error">{deleteFeedback}</div>
                )}

                <div className="up-form-footer">
                  <button type="submit" className="up-btn-danger" disabled={deleteLoading}>
                    {deleteLoading ? <><span className="up-spinner" /> Deleting...</> : "Delete My Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
