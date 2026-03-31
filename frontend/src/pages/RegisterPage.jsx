import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { register as apiRegister } from "../services/api";
import "./AuthPages.css";

const DEPARTMENTS = ["COMPS", "AIML", "AIDS", "IOT", "Mechanical"];
const YEARS = ["First Year", "Second Year", "Third Year", "Final Year"];

const parseInterests = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "student", // Start off as student by default on UI
    department: "",
    year: "",
    phone: "",
    alternateContact: "",
    interests: "",
    bio: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const navigateByRole = (role) => {
    const path = role === "admin" ? "/admin" : role === "organizer" ? "/organizer-dashboard" : "/dashboard";
    navigate(path);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const validateStep = (targetStep) => {
    if (targetStep === 1) {
      if (!form.role || !form.name.trim() || !form.email.trim()) {
        setError("Role, full name and email are required.");
        return false;
      }
      return true;
    }

    if (targetStep === 2) {
      if (!form.department || !form.year) {
        setError("Department and academic year are required.");
        return false;
      }
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return false;
      }
      if (form.password !== form.confirm) {
        setError("Passwords do not match.");
        return false;
      }
      return true;
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(3, prev + 1));
  };

  const goBack = () => {
    setError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(2)) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Send secure payload to Node Backend /register
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        department: form.department,
        year: form.year,
        phone: form.phone.trim(),
        alternateContact: form.alternateContact.trim(),
        interests: parseInterests(form.interests),
        bio: form.bio.trim(),
      };

      const response = await apiRegister(payload);

      if (response.verificationRequired) {
        navigate("/verify-email", {
          state: {
            message: response.message || "Please verify your email before signing in.",
            email: response.email || form.email,
          },
        });
        return;
      }
      
      // Store new authenticated session directly
      login({
        id: response._id,
        name: response.name,
        email: response.email,
        role: response.role,
        department: response.department,
        year: response.year || "",
        phone: response.phone || "",
        alternateContact: response.alternateContact || "",
        interests: response.interests || [],
        bio: response.bio || "",
        onboardingCompleted: true,
        avatar: response.avatar || ""
      }, response.token);

      navigateByRole(response.role);
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
          <p>Complete setup to build your AcadSync profile</p>
        </div>

        <div className="auth-steps" role="tablist" aria-label="Signup steps">
          <div className={`auth-step-pill ${step >= 1 ? "active" : ""}`}>1. Basics</div>
          <div className={`auth-step-pill ${step >= 2 ? "active" : ""}`}>2. Academic</div>
          <div className={`auth-step-pill ${step >= 3 ? "active" : ""}`}>3. Additional</div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {step === 1 && (
            <>
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
            </>
          )}

          {step === 2 && (
            <>
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
                  {DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="year">Academic year</label>
                <select id="year" name="year" value={form.year} onChange={handleChange} required>
                  <option value="">— Select your year —</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    minLength="8"
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
                    minLength="8"
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
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label htmlFor="phone">Phone number (optional)</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98XXXXXXXX"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="alternateContact">Alternate contact (optional)</label>
                <input
                  id="alternateContact"
                  name="alternateContact"
                  type="text"
                  placeholder="Email or phone"
                  value={form.alternateContact}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="interests">Interests (optional)</label>
                <input
                  id="interests"
                  name="interests"
                  type="text"
                  placeholder="Hackathons, Design, AI"
                  value={form.interests}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Short bio (optional)</label>
                <textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us a bit about yourself"
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </>
          )}

          <div className="auth-step-actions">
            {step > 1 && (
              <button type="button" className="auth-secondary-btn" onClick={goBack} disabled={loading}>
                Back
              </button>
            )}

            {step < 3 ? (
              <button type="button" className="auth-submit" onClick={goNext} disabled={loading}>
                Continue
              </button>
            ) : (
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Creating account…" : "Create Account"}
              </button>
            )}
          </div>
        </form>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
