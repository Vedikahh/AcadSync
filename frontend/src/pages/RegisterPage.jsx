import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPages.css";

function mockRegister({ name, email, password, role }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!name || !email || !password) {
        reject(new Error("All fields are required"));
        return;
      }
      if (password.length < 6) {
        reject(new Error("Password must be at least 6 characters"));
        return;
      }
      resolve({
        user: { id: Date.now(), name, email, role },
        token: "mock-jwt-token",
      });
    }, 800);
  });
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    password: "",
    confirm: "",
    role: "student",
  });
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
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { user, token } = await mockRegister(form);
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
          <h1>Create account</h1>
          <p>Join AcadSync — it&apos;s free</p>
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
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
              required
            />
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
            <label htmlFor="department">Department</label>
            <select
              id="department"
              name="department"
              value={form.department}
              onChange={handleChange}
            >
              <option value="">— Select your department —</option>
              <option>Computer Science (CSE)</option>
              <option>Electronics &amp; Communication (ECE)</option>
              <option>Mechanical Engineering (ME)</option>
              <option>Civil Engineering (CE)</option>
              <option>Information Technology (IT)</option>
              <option>MBA</option>
              <option>MCA</option>
              <option>Mathematics</option>
              <option>Physics</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="Repeat password"
              value={form.confirm}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
