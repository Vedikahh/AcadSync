import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
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
            ☰
          </button>
        )}
        <div className="navbar-brand">
          <Link to="/">
            <span className="brand-name">AcadSync</span>
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
            <Link to="/notifications" className={`nav-link ${isActive("/notifications") ? "active" : ""}`}>
              Alerts
            </Link>

            {/* User avatar dropdown */}
            <div className="user-menu">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase() || "U"}
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
      </div>
    </nav>
  );
}
