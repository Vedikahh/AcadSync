import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationsContext";
import logo from "../assets/logoo.png";
import "./Navbar.css";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "../App";

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const homeLink =
    user?.role === "admin"   ? "/admin"
    : user?.role === "organizer" ? "/organizer-dashboard"
    : "/dashboard";

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {user && (
          <button className="navbar-menu-btn" onClick={onMenuToggle} aria-label="Toggle sidebar">
            <Menu size={24} />
          </button>
        )}
        <div className="navbar-brand">
          <Link to="/">
            <img src={logo} alt="AcadSync logo" className="brand-logo" />
          </Link>
        </div>
      </div>

      <div className="navbar-links">
        {!user ? (
          <>
            <Link to="/" className={isActive("/") ? "active" : ""}>Home</Link>
            <Link to="/login" className="btn-login">Login</Link>
            <Link to="/register" className="btn-register">Get Started</Link>
          </>
        ) : (
          <>
            <Link to={homeLink} className={`nav-link ${isActive(homeLink) ? "active" : ""}`}>
              Dashboard
            </Link>
            <Link to="/calendar" className={`nav-link ${isActive("/calendar") ? "active" : ""}`}>
              Calendar
            </Link>
            <Link to="/notifications" className={`nav-link nav-link-badge-container ${isActive("/notifications") ? "active" : ""}`}>
              Alerts
              {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
            </Link>


            {/* User avatar dropdown */}
            <div className="user-menu">
              <div className="user-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="user-avatar-image" />
                ) : (
                  user.name?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              <div className="user-dropdown">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
                <Link to="/profile" className="dropdown-link">Profile</Link>
                <button onClick={handleLogout} className="logout-btn">Sign Out</button>
              </div>
            </div>
          </>
        )}

        <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </nav>
  );
}
