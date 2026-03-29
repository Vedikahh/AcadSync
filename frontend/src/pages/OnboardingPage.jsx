import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile } from "../services/api";
import "./OnboardingPage.css";

const DEPARTMENTS = ["COMPS", "AIML", "AIDS", "IOT", "Mechanical"];
const YEARS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
  "Fifth Year",
  "Postgraduate",
];

const HOME_BY_ROLE = {
  admin: "/admin",
  organizer: "/organizer-dashboard",
  student: "/dashboard",
};

const getHomeRoute = (role) => HOME_BY_ROLE[role] || "/dashboard";

const parseInterests = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);

export default function OnboardingPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: user?.name || "",
    role: user?.role || "student",
    department: user?.department || "",
    year: user?.year || "",
    bio: user?.bio || "",
    interests: Array.isArray(user?.interests) ? user.interests.join(", ") : "",
    phone: user?.phone || "",
    alternateContact: user?.alternateContact || "",
  });

  useEffect(() => {
    if (!user?.onboardingCompleted) return;
    navigate(getHomeRoute(user.role), { replace: true });
  }, [navigate, user]);

  const stepTitle = useMemo(() => {
    if (step === 1) return "Step 1 of 3 - Confirm identity";
    if (step === 2) return "Step 2 of 3 - Academic details";
    return "Step 3 of 3 - Optional details";
  }, [step]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const goNext = () => {
    if (step === 1) {
      if (!form.name.trim()) {
        setError("Name is required.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!form.department.trim() || !form.year.trim()) {
        setError("Department and academic year are required.");
        return;
      }
      setStep(3);
    }
  };

  const goBack = () => {
    setError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.department.trim() || !form.year.trim()) {
      setStep(2);
      setError("Department and academic year are required before continuing.");
      return;
    }

    const payload = {
      name: form.name,
      department: form.department,
      year: form.year,
      bio: form.bio,
      interests: parseInterests(form.interests),
      phone: form.phone,
      alternateContact: form.alternateContact,
    };

    try {
      setSaving(true);
      setError("");
      const updated = await updateUserProfile(payload);
      login({ ...user, ...updated });
      navigate(getHomeRoute(updated.role || user?.role), { replace: true });
    } catch (err) {
      setError(err.message || "Unable to save onboarding details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <h1>Complete your profile</h1>
        <p className="onboarding-subtitle">{stepTitle}</p>

        {error && <div className="onboarding-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="onboarding-step">
              <div className="onboarding-field">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="onboarding-field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={user.email || ""} disabled />
              </div>

              <div className="onboarding-field">
                <label htmlFor="role">Role</label>
                <input id="role" type="text" value={form.role} disabled />
                <span className="onboarding-hint">Role is assigned during account creation.</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step">
              <div className="onboarding-field">
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="onboarding-field">
                <label htmlFor="year">Academic Year</label>
                <select id="year" name="year" value={form.year} onChange={handleChange} required>
                  <option value="">Select academic year</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-step">
              <div className="onboarding-field">
                <label htmlFor="bio">Bio</label>
                <textarea id="bio" name="bio" rows={3} value={form.bio} onChange={handleChange} />
              </div>

              <div className="onboarding-field">
                <label htmlFor="interests">Interests</label>
                <input
                  id="interests"
                  name="interests"
                  type="text"
                  placeholder="Robotics, Coding, Literature"
                  value={form.interests}
                  onChange={handleChange}
                />
                <span className="onboarding-hint">Optional. Comma-separated, up to 10 interests.</span>
              </div>

              <div className="onboarding-grid">
                <div className="onboarding-field">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
                </div>

                <div className="onboarding-field">
                  <label htmlFor="alternateContact">Alternate Contact</label>
                  <input
                    id="alternateContact"
                    name="alternateContact"
                    type="text"
                    value={form.alternateContact}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="onboarding-actions">
            {step > 1 ? (
              <button type="button" className="btn-secondary" onClick={goBack}>
                Back
              </button>
            ) : (
              <span />
            )}

            {step < 3 ? (
              <button type="button" className="btn-primary" onClick={goNext}>
                Continue
              </button>
            ) : (
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Finish"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
