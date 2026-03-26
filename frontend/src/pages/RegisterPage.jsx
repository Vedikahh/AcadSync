import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { register as apiRegister } from "../services/api";
import "./AuthPages.css";

const STEPS = [
  { id: 1, label: "Personal Info" },
  { id: 2, label: "Academic / Role" },
  { id: 3, label: "Security" },
];

const DEPARTMENTS = ["COMPS", "AIML", "AIDS", "IOT", "Mechanical"];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    organization: "",
    year: "",
    designation: "",
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

  const goStep = (targetStep) => {
    if (targetStep < 1 || targetStep > STEPS.length) return;
    setStep(targetStep);
    setError("");
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!form.name.trim()) return "Full name is required";
      if (!form.email.trim()) return "Email address is required";
      return "";
    }

    if (currentStep === 2) {
      if (!form.role) return "Please choose your role";
      if (!form.department) return "Please select your department";
      if (form.role === "organizer" && !form.designation.trim()) {
        return "Designation is required for organizer role";
      }
      return "";
    }

    if (currentStep === 3) {
      if (form.password.length < 6) return "Password must be at least 6 characters";
      if (form.password !== form.confirm) return "Passwords do not match";
      return "";
    }

    return "";
  };

  const handleNext = () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    goStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateStep(3);
    if (validationError) {
      setError(validationError);
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
        department: form.department,
        phone: form.phone,
        organization: form.organization,
        year: form.year,
        designation: form.designation,
      };

      const response = await apiRegister(payload);
      
      // Store new authenticated session directly
      login({
        id: response._id,
        name: response.name,
        email: response.email,
        role: response.role,
        department: response.department,
        organization: response.organization || "",
        phone: response.phone || "",
        year: response.year || "",
        designation: response.designation || "",
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
      <div className="auth-card auth-card-register">
        <div className="auth-header">
          <h1>Create your account</h1>
          <p>Tell us about yourself to personalize your AcadSync experience</p>
        </div>

        <div className="auth-inline-login">
          Already registered? <Link to="/login">Sign in instantly</Link>
        </div>

        <div className="auth-stepper" aria-label="Registration steps">
          {STEPS.map((s) => (
            <div key={s.id} className="auth-stepper-item">
              <button
                type="button"
                className={`auth-step-dot ${step === s.id ? "active" : ""} ${step > s.id ? "done" : ""}`}
                onClick={() => goStep(s.id)}
                aria-label={`Go to ${s.label}`}
              >
                {step > s.id ? "✓" : s.id}
              </button>
              <span className={`auth-step-label ${step === s.id ? "active" : ""}`}>{s.label}</span>
            </div>
          ))}
        </div>

        {error?.trim() && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {step === 1 && (
            <>
              <div className="form-group">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
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
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone number (optional)</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-btn ${form.role === "student" ? "active" : ""}`}
                  onClick={() => setForm((p) => ({ ...p, role: "student" }))}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={`role-btn ${form.role === "organizer" ? "active" : ""}`}
                  onClick={() => setForm((p) => ({ ...p, role: "organizer" }))}
                >
                  Faculty / Committee
                </button>
                <button
                  type="button"
                  className={`role-btn ${form.role === "admin" ? "active" : ""}`}
                  onClick={() => setForm((p) => ({ ...p, role: "admin" }))}
                >
                  Admin
                </button>
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
                  <option value="">Select your department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="organization">Company / Organization (optional)</label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  placeholder="Your organization"
                  value={form.organization}
                  onChange={handleChange}
                />
              </div>

              {form.role === "student" && (
                <div className="form-group">
                  <label htmlFor="year">Year (optional)</label>
                  <select
                    id="year"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                  >
                    <option value="">Select year</option>
                    <option value="FY">FY</option>
                    <option value="SY">SY</option>
                    <option value="TY">TY</option>
                    <option value="BE">BE</option>
                  </select>
                </div>
              )}

              {(form.role === "organizer" || form.role === "admin") && (
                <div className="form-group">
                  <label htmlFor="designation">Designation {form.role === "organizer" ? "*" : "(optional)"}</label>
                  <input
                    id="designation"
                    name="designation"
                    type="text"
                    placeholder="e.g. Faculty Coordinator"
                    value={form.designation}
                    onChange={handleChange}
                    required={form.role === "organizer"}
                  />
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
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
            </>
          )}

          <div className="auth-wizard-actions">
            <button
              type="button"
              className="auth-secondary-btn"
              onClick={() => goStep(step - 1)}
              disabled={step === 1 || loading}
            >
              Back
            </button>

            {step < 3 ? (
              <button type="button" className="auth-submit" onClick={handleNext} disabled={loading}>
                Next
              </button>
            ) : (
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </button>
            )}
          </div>
        </form>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
