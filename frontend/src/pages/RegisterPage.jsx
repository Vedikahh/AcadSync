import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { register as apiRegister } from "../services/api";
import "./AuthPages.css";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    password: "",
    confirm: "",
    role: "student", // Start off as student by default on UI
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
      // Send secure payload to Node Backend /register
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department
      };

      const response = await apiRegister(payload);
      
      // Store new authenticated session directly
      login({
        id: response._id,
        name: response.name,
        email: response.email,
        role: response.role,
        department: response.department,
        avatar: response.avatar || ""
      }, response.token);

      navigate(response.role === "admin" ? "/admin" : response.role === "organizer" ? "/organizer-dashboard" : "/dashboard");
    } catch (err) {
      setError(err.message || "Failed to register");
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
              className={`role-btn ${form.role === "organizer" ? "active" : ""}`}
              onClick={() => setForm((p) => ({ ...p, role: "organizer" }))}
            >
              👨‍🏫 Faculty/Committee
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
              required
            >
              <option value="">— Select your department —</option>
              <option>COMPS</option>
              <option>AIML</option>
              <option>AIDS</option>
              <option>IOT</option>
              <option>Mechanical</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                minLength="6"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirm password</label>
            <div className="password-input-wrap">
              <input
                id="confirm"
                name="confirm"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat password"
                value={form.confirm}
                onChange={handleChange}
                minLength="6"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
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
