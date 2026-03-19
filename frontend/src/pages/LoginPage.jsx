import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as apiLogin, googleLogin as apiGoogleLogin, googleRegister as apiGoogleRegister } from "../services/api";
import { GoogleLogin } from '@react-oauth/google';
import "./AuthPages.css";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [completeProfile, setCompleteProfile] = useState({ show: false, token: "", role: "student", department: "" });
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
      // API call to our new Node HTTP backend
      const response = await apiLogin(form);
      
      // Store user payload & JWT safely
      login({
        id: response._id,
        name: response.name,
        email: response.email,
        role: response.role,
        department: response.department
      }, response.token);

      // Route based on newly verified database role
      navigate(response.role === "admin" ? "/admin" : response.role === "organizer" ? "/organizer-dashboard" : "/dashboard");
    } catch (err) {
      setError(err.message || "Failed to log in");
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

      login({
        id: response._id,
        name: response.name,
        email: response.email,
        role: response.role,
        department: response.department
      }, response.token);
      navigate(response.role === "admin" ? "/admin" : response.role === "organizer" ? "/organizer-dashboard" : "/dashboard");
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
      login({
        id: response._id,
        name: response.name,
        email: response.email,
        role: response.role,
        department: response.department
      }, response.token);
      navigate(response.role === "admin" ? "/admin" : response.role === "organizer" ? "/organizer-dashboard" : "/dashboard");
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
                style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '1rem', marginTop: '0.5rem', background: '#fff' }}
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

          <div className="google-login-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>
          
          <div className="divider" style={{ textAlign: 'center', margin: '1rem 0', color: '#666', fontSize: '0.9rem' }}>
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
