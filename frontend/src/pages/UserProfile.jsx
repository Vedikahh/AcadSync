import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile } from "../services/api";
import "./UserProfile.css";

const DEPARTMENTS = [
  "Computer Science (CSE)", "Electronics & Communication (ECE)",
  "Mechanical Engineering (ME)", "Civil Engineering (CE)",
  "Information Technology (IT)", "MBA", "MCA", "Physics", "Mathematics",
];

function Toast({ message, onDone }) {
  return message ? <div className="up-toast" onAnimationEnd={onDone}>{message}</div> : null;
}

export default function UserProfile() {
  const { user, login } = useAuth();

  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    department: user?.department || "",
    bio: user?.bio || "",
  });

  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const handleEditChange = (e) =>
    setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    try {
      setLoading(true);
      const updated = await updateUserProfile(editForm);
      // Update local storage and context state
      login({ ...user, ...updated });
      showToast("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePwChange = (e) => {
    setPwForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setPwError("");
  };

  const handleSavePw = async (e) => {
    e.preventDefault();
    if (!pwForm.current) { setPwError("Enter your current password."); return; }
    if (pwForm.newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError("Passwords do not match."); return; }
    setPwLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setPwLoading(false);
    setPwForm({ current: "", newPw: "", confirm: "" });
    showToast("Password changed successfully");
  };

  const roleLabel = {
    admin: "Administrator",
    organizer: "Faculty/Committee Member",
    student: "Student",
  }[user?.role] || "Member";

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="up-page">
      <Toast message={toast} />

      <div className="up-container">
        
        {/* Left Sidebar: Profile Identity */}
        <div className="up-sidebar">
          <div className="up-hero-card">
            
            <div className="up-avatar-wrap">
              <div className={`up-avatar up-avatar-${user?.role || "student"}`}>
                {initials}
              </div>
            </div>
            
            <div className="up-hero-info">
              <h1 className="up-name">{user?.name || "User"}</h1>
              <span className={`up-role-badge badge-${user?.role || "student"}`}>
                {roleLabel}
              </span>
              <p className="up-email">{user?.email}</p>
              {user?.department && (
                <div className="up-dept-box">
                  <span className="up-dept-label">Department</span>
                  <span className="up-dept-value">{user.department}</span>
                </div>
              )}
              {user?.bio && (
                <div className="up-bio-box">
                  <span className="up-dept-label">Bio</span>
                  <p className="up-bio-text">{user.bio}</p>
                </div>
              )}

            </div>

          </div>

          <div className="up-nav-menu">
            {[
              { id: "profile", label: "Profile Details", icon: "⌂" },
              { id: "password", label: "Security & Password", icon: "🔒" },
              { id: "activity", label: "Recent Activity", icon: "⚡" },
            ].map((t) => (
              <button
                key={t.id}
                className={`up-nav-item ${activeTab === t.id ? "up-nav-active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                <div className="up-nav-icon">{t.icon}</div>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="up-content-area">
          <div className="up-panel-wrapper">
            
            {/* Edit Profile */}
            {activeTab === "profile" && (
              <div className="up-panel up-animate">
                <div className="up-panel-header">
                  <h2>Profile Details</h2>
                  <p>Manage your account settings and personal information.</p>
                </div>
                
                <form onSubmit={handleSaveProfile} className="up-form">
                  <div className="up-form-grid">
                    <div className="up-field">
                      <label>Full Name</label>
                      <input
                        name="name"
                        type="text"
                        value={editForm.name}
                        onChange={handleEditChange}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="up-field">
                      <label>Email Address</label>
                      <input type="email" value={user?.email || ""} disabled className="up-input-disabled" />
                      <span className="up-hint">Email is managed by your organization.</span>
                    </div>
                  </div>

                  <div className="up-field">
                    <label>Department</label>
                    <select name="department" value={editForm.department} onChange={handleEditChange}>
                      <option value="">— Not specified —</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  
                  <div className="up-field">
                    <label>Bio / About</label>
                    <textarea
                      name="bio"
                      rows={4}
                      placeholder="Add a short description about yourself..."
                      value={editForm.bio}
                      onChange={handleEditChange}
                    />
                  </div>
                  
                  <div className="up-form-footer">
                    <button type="submit" className="up-btn-primary" disabled={loading}>
                      {loading ? <><span className="up-spinner" /> Saving...</> : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Change Password */}
            {activeTab === "password" && (
              <div className="up-panel up-animate">
                <div className="up-panel-header">
                  <h2>Security Settings</h2>
                  <p>Update your password to keep your account secure.</p>
                </div>
                
                {pwError && (
                  <div className="up-error-banner">
                    <span className="up-error-icon">!</span>
                    {pwError}
                  </div>
                )}
                
                <form onSubmit={handleSavePw} className="up-form">
                  <div className="up-field">
                    <label>Current Password</label>
                    <input name="current" type="password" placeholder="••••••••" value={pwForm.current} onChange={handlePwChange} />
                  </div>
                  <div className="up-divider" />
                  <div className="up-field">
                    <label>New Password</label>
                    <input name="newPw" type="password" placeholder="Min. 6 characters" value={pwForm.newPw} onChange={handlePwChange} />
                  </div>
                  <div className="up-field">
                    <label>Confirm New Password</label>
                    <input name="confirm" type="password" placeholder="Repeat new password" value={pwForm.confirm} onChange={handlePwChange} />
                  </div>
                  
                  <div className="up-form-footer">
                    <button type="submit" className="up-btn-primary" disabled={pwLoading}>
                      {pwLoading ? <><span className="up-spinner" /> Updating...</> : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Activity */}
            {activeTab === "activity" && (
              <div className="up-panel up-animate">
                <div className="up-panel-header">
                  <h2>Recent Activity</h2>
                  <p>Your latest actions and system events.</p>
                </div>
                
                <div className="up-activity-feed">
                  {[
                    { type: "success", title: "Event Approved", text: "Your event \"Annual Tech Fest 2025\" was approved.", time: "30 min ago" },
                    { type: "info", title: "Proposal Submitted", text: "You submitted \"Workshop on AI/ML\" for review.", time: "2 hours ago" },
                    { type: "alert", title: "Conflict Warning", text: "New conflict alert: Cultural Night overlaps DSA lecture.", time: "1 day ago" },
                    { type: "system", title: "System Event", text: "Account created successfully.", time: "3 days ago" },
                  ].map((item, i) => (
                    <div key={i} className="up-feed-item">
                      <div className={`up-feed-icon bg-${item.type}`} />
                      <div className="up-feed-content">
                        <div className="up-feed-header">
                          <span className="up-feed-title">{item.title}</span>
                          <span className="up-feed-time">{item.time}</span>
                        </div>
                        <p className="up-feed-text">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
