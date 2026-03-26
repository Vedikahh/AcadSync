import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import { useTheme } from "../context/ThemeContext";
import "./Sidebar.css";

const Icons = {
  Dashboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Events: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>,
  Create: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  Notifications: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Profile: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Manage: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  Schedule: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Conflict: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Logout: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 0l4.24-4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08 0l4.24 4.24"/></svg>,
  Sun: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  ChevronUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  ChevronDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
};

const STUDENT_LINKS = [
  { to: "/dashboard",     icon: "Dashboard",     label: "Dashboard" },
  { to: "/calendar",      icon: "Calendar",      label: "Calendar" },
  { to: "/events",        icon: "Events",        label: "Campus Events" },
  { to: "/notifications", icon: "Notifications", label: "Notifications" },
];

const ORGANIZER_LINKS = [
  { to: "/organizer-dashboard", icon: "Dashboard",     label: "Dashboard" },
  { to: "/calendar",          icon: "Calendar",      label: "Calendar" },
  { to: "/events",            icon: "Events",        label: "Campus Events" },
  { to: "/my-events",         icon: "Manage",        label: "My Events" },
  { to: "/notifications",     icon: "Notifications", label: "Notifications" },
];

const ADMIN_LINKS = [
  { to: "/admin",         icon: "Dashboard",     label: "Dashboard" },
  { to: "/calendar",      icon: "Calendar",      label: "Calendar" },
  { to: "/manage-events", icon: "Manage",        label: "Manage Events" },
  { to: "/schedule",      icon: "Schedule",      label: "Academic Schedule" },
  { to: "/conflict",      icon: "Conflict",      label: "Conflict Reports" },
  { to: "/notifications", icon: "Notifications", label: "Notifications" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = getLinksByRole(user?.role);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
    if (onClose) onClose();
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const ChevronIcon = isMenuOpen ? Icons.ChevronUp : Icons.ChevronDown;
  const ThemeIcon = isDark ? Icons.Sun : Icons.Moon;

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "sidebar-overlay-active" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>

        {/* Profile & Menu */}
        <div className="sidebar-profile-menu">
          <button
            className="sidebar-profile-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="sidebar-avatar" style={{ background: getColorByRole(user?.role) }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="sidebar-avatar-image" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <div className="sidebar-profile-info">
              <p className="sidebar-profile-name">{user?.name || "User"}</p>
              <p className="sidebar-profile-role">
                {getRoleLabel(user?.role)}
              </p>
            </div>
            <div className="sidebar-menu-chevron">
              <ChevronIcon />
            </div>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="sidebar-dropdown-menu">
              <div className="sidebar-dropdown-email">
                {user?.email || "user@example.com"}
              </div>
              <button className="sidebar-dropdown-item">
                Add another account
              </button>
              <div className="sidebar-dropdown-divider" />
              <button className="sidebar-dropdown-item" onClick={handleThemeToggle}>
                <ThemeIcon />
                {isDark ? "Light Theme" : "Dark Theme"}
              </button>
              <button className="sidebar-dropdown-item sidebar-dropdown-logout" onClick={handleLogout}>
                <Icons.Logout />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {links.map((link) => {
            const Icon = Icons[link.icon];
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                }
                onClick={onClose}
              >
                <span className="sidebar-link-icon"><Icon /></span>
                <span className="sidebar-link-label">{link.label}</span>
                {link.to === "/notifications" && unreadCount > 0 && (
                  <span className="sidebar-badge">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Profile Link in Footer */}
        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
            onClick={onClose}
          >
            <span className="sidebar-link-icon"><Icons.Profile /></span>
            <span className="sidebar-link-label">Profile</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}

// Helper functions
function getColorByRole(role) {
  const colors = {
    admin: "#EF4444",
    organizer: "#F97316",
    student: "#2563EB",
  };
  return colors[role] || "#2563EB";
}

function getRoleLabel(role) {
  const labels = {
    admin: "Administrator",
    organizer: "Faculty/Committee",
    student: "Student",
  };
  return labels[role] || "Member";
}

function getLinksByRole(role) {
  if (role === "admin")   return ADMIN_LINKS;
  if (role === "organizer") return ORGANIZER_LINKS;
  return STUDENT_LINKS;
}