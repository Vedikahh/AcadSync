import { Link } from "react-router-dom";
import "./LandingPage.css";

const FEATURES = [
  {
    icon: "🗓️",
    title: "Event Approval Workflow",
    description:
      "Submit event requests online and track approvals in real-time. Admins can approve or reject with a single click.",
  },
  {
    icon: "🔔",
    title: "Smart Notifications",
    description:
      "Automated alerts keep students and staff informed about upcoming events, deadlines, and announcements.",
  },
  {
    icon: "📊",
    title: "Centralized Dashboard",
    description:
      "One unified place to manage all academic activities, events, and communications across your campus.",
  },
  {
    icon: "🔐",
    title: "Role-Based Access",
    description:
      "Separate Admin and Student portals with tailored experiences and permissions for each role.",
  },
  {
    icon: "🤖",
    title: "AI-Powered Insights",
    description:
      "Leverage AI to prioritize notifications, detect conflicts, and surface relevant information automatically.",
  },
  {
    icon: "📱",
    title: "Responsive Design",
    description:
      "Works seamlessly on desktop, tablet, and mobile so you stay connected anywhere on campus.",
  },
];

const STEPS = [
  { step: "01", title: "Register your account", desc: "Sign up as a student or admin." },
  { step: "02", title: "Submit or manage events", desc: "Students request events; admins review them." },
  { step: "03", title: "Get notified instantly", desc: "Receive updates the moment something changes." },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">✨ AI-Powered Academic Platform</div>
          <h1 className="hero-title">
            Sync Your Campus,{" "}
            <span className="gradient-text">Smarter</span>
          </h1>
          <p className="hero-subtitle">
            AcadSync streamlines event management, campus notifications, and
            academic coordination — all in one intelligent platform built for
            students and administrators.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="cta-primary">
              Get Started Free →
            </Link>
            <Link to="/login" className="cta-secondary">
              Sign In
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">100+</span>
              <span className="stat-label">Events Managed</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">500+</span>
              <span className="stat-label">Students Served</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">99%</span>
              <span className="stat-label">Uptime</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-card primary-card">
            <div className="card-icon">🎓</div>
            <div className="card-info">
              <span className="card-title">Event Approved</span>
              <span className="card-sub">Annual Tech Fest 2025</span>
            </div>
            <span className="card-badge approved">✓</span>
          </div>
          <div className="visual-card secondary-card">
            <div className="card-icon">🔔</div>
            <div className="card-info">
              <span className="card-title">New Notification</span>
              <span className="card-sub">3 events pending review</span>
            </div>
          </div>
          <div className="visual-card tertiary-card">
            <div className="card-icon">📊</div>
            <div className="card-info">
              <span className="card-title">Dashboard Active</span>
              <span className="card-sub">24 students online</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="section-header">
          <h2>Everything your campus needs</h2>
          <p>Powerful tools to keep your academic community in sync.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>How it works</h2>
          <p>Get up and running in minutes.</p>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={i} className="step">
              <div className="step-number">{s.step}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <h2>Ready to transform your campus?</h2>
        <p>Join AcadSync today and experience seamless academic management.</p>
        <Link to="/register" className="cta-primary">
          Create Your Account →
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-name-footer">AcadSync AI</span>
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} AcadSync. Built with ❤️ for students.
        </p>
      </footer>
    </div>
  );
}
