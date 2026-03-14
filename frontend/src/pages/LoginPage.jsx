import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPages.css";

// Mock login for demo (replace with real API call when backend is ready)
function mockLogin({ email, password, role }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !password) {
        reject(new Error("Email and password are required"));
        return;
      }
      resolve({
        user: { id: 1, name: email.split("@")[0], email, role, department: role === "faculty" ? "CSE" : "" },
        token: "mock-jwt-token",
      });
    }, 800);
  });
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { user, token } = await mockLogin(form);
      login(user, token);
      navigate(user.role === "admin" ? "/admin" : user.role === "faculty" ? "/faculty-dashboard" : "/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">🎓</span>
          <h1>Welcome back</h1>
          <p>Sign in to your AcadSync account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="role-selector">
            <button
              type="button"
              className={`role-btn ${form.role === "student" ? "active" : ""}`}
              onClick={() => setForm((p) => ({ ...p, role: "student" }))}
            >
              🎓 Student
            </button>
            <button
              type="button"
              className={`role-btn ${form.role === "faculty" ? "active" : ""}`}
              onClick={() => setForm((p) => ({ ...p, role: "faculty" }))}
            >
              👨‍🏫 Faculty
            </button>
            <button
              type="button"
              className={`role-btn ${form.role === "admin" ? "active" : ""}`}
              onClick={() => setForm((p) => ({ ...p, role: "admin" }))}
            >
              🔑 Admin
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@college.edu"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="auth-footer-text">
          Don&apos;t have an account?{" "}
          <Link to="/register">Create one →</Link>
        </p>
      </div>
    </div>
  );
}
