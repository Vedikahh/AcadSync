import { Link } from "react-router-dom";
import "./LandingPage.css";

const FEATURES = [
  {
    color: "#2563EB",
    label: "Event Management",
    title: "Streamlined Event Approval",
    desc: "Submit event proposals online. Admins review, approve, or reject with full conflict visibility — no emails, no chaos.",
  },
  {
    color: "#6366F1",
    label: "AI-Powered",
    title: "Automatic Conflict Detection",
    desc: "AcadSync AI scans every proposed event against existing lectures, labs, and exams and flags clashes instantly.",
  },
  {
    color: "#22C55E",
    label: "Academic Schedule",
    title: "Unified Timetable View",
    desc: "One calendar that shows lectures, exams, and campus events side by side — color-coded for instant clarity.",
  },
  {
    color: "#F97316",
    label: "Role-Based Access",
    title: "Three-Role System",
    desc: "Separate dashboards for Students, Faculty, and Admins — each with tailored views and permissions.",
  },
  {
    color: "#8B5CF6",
    label: "Notifications",
    title: "Real-Time Alerts",
    desc: "Instant notifications the moment an event is approved, rejected, or a conflict is detected on your schedule.",
  },
  {
    color: "#EF4444",
    label: "Conflict Reports",
    title: "Severity-Based Reporting",
    desc: "High, medium, and low conflict reports with affected student counts, clash details, and AI-suggested alternatives.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Register your account",
    desc: "Sign up as a Student, Faculty, or Admin. Your role determines what you see and can do.",
  },
  {
    num: "02",
    title: "Submit or manage events",
    desc: "Students propose events; Faculty review schedules; Admins approve with full AI conflict reports.",
  },
  {
    num: "03",
    title: "Stay in sync automatically",
    desc: "Receive real-time notifications. All schedules update instantly across every role.",
  },
];

const ROLES = [
  {
    role: "Student / Club",
    color: "#2563EB",
    bg: "#EFF6FF",
    points: [
      "Propose events with one form",
      "Track approval status live",
      "View campus calendar",
      "Get notified instantly",
    ],
  },
  {
    role: "Faculty",
    color: "#6366F1",
    bg: "#EEF2FF",
    points: [
      "See today's lecture schedule",
      "View conflicts with events",
      "Access timetable calendar",
      "Receive conflict alerts",
    ],
  },
  {
    role: "Admin",
    color: "#0F172A",
    bg: "#F1F5F9",
    points: [
      "Approve or reject proposals",
      "View AI conflict reports",
      "Manage academic schedule",
      "Monitor all departments",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="lp">

      {/* ────────────────── HERO ────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-bg" aria-hidden="true">
          <div className="lp-bg-blob lp-blob-1" />
          <div className="lp-bg-blob lp-blob-2" />
          <div className="lp-bg-grid" />
        </div>

        <div className="lp-hero-inner">
          {/* Left: copy */}
          <div className="lp-hero-copy">
            <span className="lp-hero-pill">AI-Powered Academic Scheduler</span>
            <h1 className="lp-hero-title">
              Smarter scheduling<br />
              for every <span className="lp-hero-accent">campus role</span>
            </h1>
            <p className="lp-hero-sub">
              AcadSync brings event management, academic timetables, and AI
              conflict detection into one clean platform — built for students,
              faculty, and administrators.
            </p>

            <div className="lp-hero-actions">
              <Link to="/register" className="lp-btn-primary">
                Get Started Free
                <span className="lp-btn-arrow">→</span>
              </Link>
              <Link to="/login" className="lp-btn-outline">Sign In</Link>
            </div>

            <div className="lp-hero-stats">
              <div className="lp-stat">
                <span className="lp-stat-num">100+</span>
                <span className="lp-stat-label">Events Managed</span>
              </div>
              <div className="lp-stat-divider" />
              <div className="lp-stat">
                <span className="lp-stat-num">500+</span>
                <span className="lp-stat-label">Students Served</span>
              </div>
              <div className="lp-stat-divider" />
              <div className="lp-stat">
                <span className="lp-stat-num">3</span>
                <span className="lp-stat-label">User Roles</span>
              </div>
              <div className="lp-stat-divider" />
              <div className="lp-stat">
                <span className="lp-stat-num">AI</span>
                <span className="lp-stat-label">Conflict Detection</span>
              </div>
            </div>
          </div>

          {/* Right: dashboard preview */}
          <div className="lp-hero-visual" aria-hidden="true">
            {/* Simulated dashboard window */}
            <div className="lp-dash-window">
              <div className="lp-dash-topbar">
                <span className="lp-dot lp-dot-red" />
                <span className="lp-dot lp-dot-yellow" />
                <span className="lp-dot lp-dot-green" />
                <span className="lp-dash-url">acadsync.app/dashboard</span>
              </div>
              <div className="lp-dash-body">
                {/* Sidebar strip */}
                <div className="lp-dash-sidebar">
                  {["Dashboard","Calendar","Events","Schedule","Conflicts","Profile"].map((item, i) => (
                    <div key={item} className={`lp-dash-nav-item ${i === 0 ? "lp-dash-nav-active" : ""}`}>
                      {item}
                    </div>
                  ))}
                </div>
                {/* Main area */}
                <div className="lp-dash-main">
                  <div className="lp-dash-heading">Admin Panel</div>
                  {/* Stat cards */}
                  <div className="lp-dash-stats">
                    {[
                      { n: "428", l: "Students",  c: "#2563EB" },
                      { n: "3",   l: "Pending",   c: "#F97316" },
                      { n: "12",  l: "Approved",  c: "#22C55E" },
                      { n: "2",   l: "Conflicts", c: "#EF4444" },
                    ].map((s) => (
                      <div key={s.l} className="lp-dash-stat-card" style={{ borderLeftColor: s.c }}>
                        <span className="lp-dash-stat-num" style={{ color: s.c }}>{s.n}</span>
                        <span className="lp-dash-stat-label">{s.l}</span>
                      </div>
                    ))}
                  </div>
                  {/* Event rows */}
                  <div className="lp-dash-table-head">Pending Approvals</div>
                  {[
                    { name: "Annual Tech Fest 2025", dept: "CSE",  status: "Pending",  sc: "#F97316", sb: "#FFF3E0" },
                    { name: "Cultural Night",         dept: "Arts", status: "Conflict", sc: "#EF4444", sb: "#FEF2F2" },
                    { name: "Hackathon 2025",         dept: "IT",   status: "Approved", sc: "#22C55E", sb: "#F0FDF4" },
                  ].map((r) => (
                    <div key={r.name} className="lp-dash-row">
                      <span className="lp-dash-row-name">{r.name}</span>
                      <span className="lp-dash-row-dept">{r.dept}</span>
                      <span className="lp-dash-badge" style={{ color: r.sc, background: r.sb }}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Floating conflict card */}
            <div className="lp-float-card lp-float-conflict">
              <div className="lp-fc-dot lp-fc-red" />
              <div>
                <div className="lp-fc-title">High Conflict Detected</div>
                <div className="lp-fc-sub">Tech Fest vs DSA Lecture · 09:00–10:00</div>
              </div>
            </div>
            {/* Floating approved card */}
            <div className="lp-float-card lp-float-approved">
              <div className="lp-fc-dot lp-fc-green" />
              <div>
                <div className="lp-fc-title">Event Approved</div>
                <div className="lp-fc-sub">Sports Day · Main Ground</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── ROLES ────────────────── */}
      <section className="lp-roles">
        <div className="lp-section-header">
          <h2>Built for every role</h2>
          <p>One platform, three tailored experiences.</p>
        </div>
        <div className="lp-roles-grid">
          {ROLES.map((r) => (
            <div key={r.role} className="lp-role-card" style={{ borderTopColor: r.color }}>
              <div className="lp-role-tag" style={{ background: r.bg, color: r.color }}>
                {r.role}
              </div>
              <ul className="lp-role-list">
                {r.points.map((p) => (
                  <li key={p}>
                    <span className="lp-role-check" style={{ color: r.color }}>✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── FEATURES ────────────────── */}
      <section className="lp-features">
        <div className="lp-section-header">
          <h2>Everything your campus needs</h2>
          <p>Powerful tools that keep your academic community in sync.</p>
        </div>
        <div className="lp-features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="lp-feature-card">
              <div className="lp-feature-accent" style={{ background: f.color }} />
              <span className="lp-feature-label" style={{ color: f.color, background: f.color + "18" }}>
                {f.label}
              </span>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── HOW IT WORKS ────────────────── */}
      <section className="lp-how">
        <div className="lp-section-header">
          <h2>How it works</h2>
          <p>Up and running in minutes, not days.</p>
        </div>
        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <div key={s.num} className="lp-step">
              <div className="lp-step-num">{s.num}</div>
              {i < STEPS.length - 1 && <div className="lp-step-connector" />}
              <h3 className="lp-step-title">{s.title}</h3>
              <p className="lp-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────── CTA ────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">Ready to sync your campus?</h2>
          <p className="lp-cta-sub">
            Join AcadSync and eliminate scheduling conflicts with AI assistance.
          </p>
          <div className="lp-cta-actions">
            <Link to="/register" className="lp-btn-cta-primary">
              Create Your Account →
            </Link>
            <Link to="/login" className="lp-btn-cta-outline">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ────────────────── FOOTER ────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">
          <span className="lp-footer-logo">AcadSync AI</span>
        </div>
        <p className="lp-footer-copy">
          © {new Date().getFullYear()} AcadSync. Academic scheduling, reimagined.
        </p>
        <div className="lp-footer-links">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </footer>
    </div>
  );
}
