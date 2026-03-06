import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <span className="brand-icon">🎓</span>
          <span className="brand-name">AcadSync</span>
        </Link>
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
            <Link
              to={user.role === "admin" ? "/admin" : "/dashboard"}
              className={isActive(user.role === "admin" ? "/admin" : "/dashboard") ? "active" : ""}
            >
              Dashboard
            </Link>
            <Link
              to="/events"
              className={isActive("/events") ? "active" : ""}
            >
              Events
            </Link>
            <Link
              to="/notifications"
              className={isActive("/notifications") ? "active" : ""}
            >
              Notifications
            </Link>
            <div className="user-menu">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="user-dropdown">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
