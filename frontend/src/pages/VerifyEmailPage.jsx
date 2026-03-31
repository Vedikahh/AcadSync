import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  requestEmailVerification as apiRequestEmailVerification,
  verifyEmail as apiVerifyEmail,
  verifyEmailOtp as apiVerifyEmailOtp,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./AuthPages.css";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");

  const navigateByRole = (role) => {
    const path = role === "admin" ? "/admin" : role === "organizer" ? "/organizer-dashboard" : "/dashboard";
    navigate(path);
  };

  useEffect(() => {
    const runVerification = async () => {
      if (!token) return;

      setLoading(true);
      setError("");
      setMessage("");

      try {
        const response = await apiVerifyEmail(token);
        if (response?.token) {
          login({ ...response, id: response._id }, response.token);
          navigateByRole(response.role);
          return;
        }
        setMessage(response.message || "Email verified successfully.");
      } catch (err) {
        setError(err.message || "Verification link is invalid or expired.");
      } finally {
        setLoading(false);
      }
    };

    runVerification();
  }, [token]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiVerifyEmailOtp(email, otp);
      if (response?.token) {
        login({ ...response, id: response._id }, response.token);
        navigateByRole(response.role);
        return;
      }

      setMessage(response.message || "Email verified successfully.");
      setOtp("");
    } catch (err) {
      setError(err.message || "OTP is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequestEmailVerification(email);
      setMessage(response.message || "If eligible, a verification email has been sent.");
    } catch (err) {
      setError(err.message || "Unable to send verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">AC</span>
          <h1>Verify email</h1>
          <p>{token ? "Confirming your email address" : "Enter the OTP sent to your email"}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-error" style={{ borderColor: "#93C5FD", color: "#1D4ED8", background: "#EFF6FF" }}>{message}</div>}

        {!token && (
          <>
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="otp">Verification OTP</label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <form onSubmit={handleResend} className="auth-form" style={{ marginTop: "0.8rem" }}>
              <div className="form-group">
                <label htmlFor="resend-email">Didn&apos;t get OTP? Resend</label>
                <input
                  id="resend-email"
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Sending..." : "Resend OTP"}
              </button>
            </form>
          </>
        )}

        {token && loading && (
          <p className="auth-footer-text">Verifying...</p>
        )}

        {token && !loading && (
          <form onSubmit={handleResend} className="auth-form" style={{ marginTop: "0.8rem" }}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Sending..." : "Resend OTP"}
            </button>
          </form>
        )}

        <p className="auth-footer-text">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
