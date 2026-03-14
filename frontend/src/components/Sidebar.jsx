import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

const STUDENT_LINKS = [
  { to: "/dashboard",     icon: "Dashboard",     label: "Dashboard" },
  { to: "/calendar",      icon: "Calendar",      label: "Calendar" },
  { to: "/events",        icon: "Events",        label: "Events" },
  { to: "/create-event",  icon: "Create",        label: "Create Event" },
  { to: "/notifications", icon: "Notifications", label: "Notifications" },
  { to: "/profile",       icon: "Profile",       label: "Profile" },
];

const FACULTY_LINKS = [
  { to: "/faculty-dashboard", icon: "Dashboard",     label: "Dashboard" },
  { to: "/calendar",          icon: "Calendar",      label: "Calendar" },
  { to: "/events",            icon: "Events",        label: "Campus Events" },
  { to: "/notifications",     icon: "Notifications", label: "Notifications" },
  { to: "/profile",           icon: "Profile",       label: "Profile" },
];

const ADMIN_LINKS = [
  { to: "/admin",         icon: "Dashboard",     label: "Dashboard" },
  { to: "/calendar",      icon: "Calendar",      label: "Calendar" },
  { to: "/manage-events", icon: "Manage",        label: "Manage Events" },
  { to: "/schedule",      icon: "Schedule",      label: "Academic Schedule" },
  { to: "/conflict",      icon: "Conflict",      label: "Conflict Reports" },
  { to: "/notifications", icon: "Notifications", label: "Notifications" },
  { to: "/profile",       icon: "Profile",       label: "Profile" },
];

function getLinksByRole(role) {
  if (role === "admin")   return ADMIN_LINKS;
  if (role === "faculty") return FACULTY_LINKS;
  return STUDENT_LINKS;
}

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = getLinksByRole(user?.role);

  const handleLogout = () => {
    logout();
    navigate("/");
    if (onClose) onClose();
  };

  const roleLabel = {
    admin:   "Administrator",
    faculty: "Faculty",
    student: "Student",
  }[user?.role] || "Member";

  const roleColor = {
    admin:   "#EF4444",
    faculty: "#F97316",
    student: "#2563EB",
  }[user?.role] || "#2563EB";

  const ChevronIcon = collapsed ? Icons.ChevronRight : Icons.ChevronLeft;

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "sidebar-overlay-active" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""} ${collapsed ? "sidebar-collapsed" : ""}`}>

        {/* Collapse toggle button — desktop only */}
        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronIcon />
        </button>

        {/* Profile */}
        <div className="sidebar-profile">
          <div className="sidebar-avatar" style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}dd)` }}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name || "User"}</p>
            <span
              className="sidebar-role-badge"
              style={{ background: roleColor + "18", color: roleColor, border: `1px solid ${roleColor}33` }}
            >
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-group">
            <p className="sidebar-nav-label">Main Menu</p>
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
                  data-tooltip={collapsed ? link.label : undefined}
                >
                  <span className="sidebar-link-icon"><Icon /></span>
                  <span className="sidebar-link-label">{link.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button
            className="sidebar-logout"
            onClick={handleLogout}
            data-tooltip={collapsed ? "Sign Out" : undefined}
          >
            <span className="sidebar-link-icon"><Icons.Logout /></span>
            <span className="sidebar-link-label">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}