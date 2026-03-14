import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const STUDENT_LINKS = [
  { to: "/dashboard",     icon: "⊞", label: "Dashboard" },
  { to: "/calendar",      icon: "▦",  label: "Calendar" },
  { to: "/events",        icon: "◈",  label: "Events" },
  { to: "/create-event",  icon: "+",  label: "Create Event" },
  { to: "/notifications", icon: "◉",  label: "Notifications" },
  { to: "/profile",       icon: "◯",  label: "Profile" },
];

const FACULTY_LINKS = [
  { to: "/faculty-dashboard", icon: "⊞", label: "Dashboard" },
  { to: "/calendar",          icon: "▦",  label: "Calendar" },
  { to: "/events",            icon: "◈",  label: "Campus Events" },
  { to: "/notifications",     icon: "◉",  label: "Notifications" },
  { to: "/profile",           icon: "◯",  label: "Profile" },
];

const ADMIN_LINKS = [
  { to: "/admin",         icon: "⊞", label: "Dashboard" },
  { to: "/calendar",      icon: "▦",  label: "Calendar" },
  { to: "/manage-events", icon: "≡",  label: "Manage Events" },
  { to: "/schedule",      icon: "☰",  label: "Academic Schedule" },
  { to: "/conflict",      icon: "!",  label: "Conflict Reports" },
  { to: "/notifications", icon: "◉",  label: "Notifications" },
  { to: "/profile",       icon: "◯",  label: "Profile" },
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
          {collapsed ? "›" : "‹"}
        </button>

        {/* Profile */}
        <div className="sidebar-profile">
          <div className="sidebar-avatar" style={{ background: roleColor }}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name || "User"}</p>
            <span
              className="sidebar-role-badge"
              style={{ background: roleColor + "18", color: roleColor }}
            >
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
              }
              onClick={onClose}
              data-tooltip={collapsed ? link.label : undefined}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              <span className="sidebar-link-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button
            className="sidebar-logout"
            onClick={handleLogout}
            data-tooltip={collapsed ? "Sign Out" : undefined}
          >
            <span className="sidebar-link-icon">×</span>
            <span className="sidebar-link-label">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}