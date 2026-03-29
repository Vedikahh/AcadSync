import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as apiLogin, googleLogin as apiGoogleLogin, googleRegister as apiGoogleRegister } from "../services/api";
import { GoogleLogin } from '@react-oauth/google';
import "./AuthPages.css";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [completeProfile, setCompleteProfile] = useState({ show: false, token: "", role: "student", department: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const navigateByRole = (role, onboardingCompleted = false) => {
    if (!onboardingCompleted) {
      navigate("/onboarding");
      return;
    }
    const path = role === "admin" ? "/admin" : role === "organizer" ? "/organizer-dashboard" : "/dashboard";
    navigate(path);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // API call to our new Node HTTP backend
      const response = await apiLogin(form);
      
      // Store user payload & JWT safely
      login({ ...response, id: response._id }, response.token);

      // Route based on newly verified database role
      navigateByRole(response.role, response.onboardingCompleted);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("verify")) {
        setError("Please verify your email before signing in. You can request a new verification link below.");
      } else {
        setError(err.message || "Failed to log in");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiGoogleLogin(credentialResponse.credential);
      
      if (response.isNewUser) {
        setCompleteProfile({ 
          show: true, 
          token: response.token, 
          role: "student", 
          department: "" 
        });
        return; // Halt and show the complete profile form
      }

      login({ ...response, id: response._id }, response.token);
      navigateByRole(response.role, response.onboardingCompleted);
    } catch (err) {
      setError(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In was unsuccessful. Try again later.");
  };

  const handleCompleteProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await apiGoogleRegister({
        token: completeProfile.token,
        role: completeProfile.role,
        department: completeProfile.department
      });
      login({ ...response, id: response._id }, response.token);
      navigateByRole(response.role, response.onboardingCompleted);
    } catch (err) {
      setError(err.message || "Failed to complete profile");
    } finally {
      setLoading(false);
    }
  };

  if (completeProfile.show) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">🎓</span>
            <h1>Complete Your Profile</h1>
            <p>You&apos;re almost there! Tell us your role.</p>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleCompleteProfileSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={completeProfile.role}
                onChange={(e) => setCompleteProfile({...completeProfile, role: e.target.value})}
                required
                  className="complete-profile-select"
              >
                <option value="student">Student</option>
                <option value="organizer">Faculty/Committee</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                type="text"
                placeholder="e.g. Computer Science"
                value={completeProfile.department}
                onChange={(e) => setCompleteProfile({...completeProfile, department: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Saving…" : "Finish Setup"}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
          
          {/* Note: Roles are now database bound, we don't ask users to select their role at login anymore */}

          <div className="google-login-container">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>
          
          <div className="divider">
            OR SIGN IN WITH EMAIL
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
            <div className="password-input-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
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
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="auth-footer-text auth-footer-tight">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>

        <p className="auth-footer-text">
          Don&apos;t have an account?{" "}
          <Link to="/register">Create one →</Link>
        </p>
        <p className="auth-footer-text auth-footer-compact">
          Need a verification link? <Link to="/verify-email">Resend verification</Link>
        </p>
      </div>
    </div>
  );
}
