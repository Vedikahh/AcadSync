import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Zap,
  Shield,
  Bell,
  AlertTriangle,
  Users,
  UserCheck,
  Settings,
  CheckCircle,
  ChevronDown,
  Star,
  ArrowRight,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Code2,
  MessageCircle,
  Briefcase,
  Mail,
  BarChart3,
  Clock,
  Globe,
} from "lucide-react";
import "./LandingPage.css";

/* ─────────────── DATA ─────────────── */

const FEATURES = [
  {
    icon: Calendar,
    color: "#2563EB",
    label: "Event Management",
    title: "Streamlined Event Approval",
    desc: "Submit event proposals online. Admins review, approve, or reject with full conflict visibility — no emails, no chaos.",
  },
  {
    icon: Zap,
    color: "#6366F1",
    label: "Conflict Intelligence",
    title: "Automatic Conflict Detection",
    desc: "AcadSync scans every proposed event against existing lectures, labs, and exams and flags clashes instantly.",
  },
  {
    icon: BarChart3,
    color: "#22C55E",
    label: "Academic Schedule",
    title: "Unified Timetable View",
    desc: "One calendar that shows lectures, exams, and campus events side by side — color-coded for instant clarity.",
  },
  {
    icon: Shield,
    color: "#F97316",
    label: "Role-Based Access",
    title: "Three-Role System",
    desc: "Separate dashboards for Students, Faculty/Committee, and Admins — each with tailored views and permissions.",
  },
  {
    icon: Bell,
    color: "#8B5CF6",
    label: "Notifications",
    title: "Real-Time Alerts",
    desc: "Instant notifications the moment an event is approved, rejected, or a conflict is detected on your schedule.",
  },
  {
    icon: AlertTriangle,
    color: "#EF4444",
    label: "Conflict Reports",
    title: "Severity-Based Reporting",
    desc: "High, medium, and low conflict reports with affected student counts, clash details, and suggested alternatives.",
  },
];

const STEPS = [
  {
    num: "01",
    icon: UserCheck,
    title: "Register your account",
    desc: "Sign up as a Student, Faculty/Committee, or Admin. Your role determines what you see and can do.",
  },
  {
    num: "02",
    icon: ClipboardList,
    title: "Submit or manage events",
    desc: "Faculty/Committee propose events; conflict checks run automatically; Admins approve with full conflict reports.",
  },
  {
    num: "03",
    icon: Globe,
    title: "Stay in sync automatically",
    desc: "Receive real-time notifications. All schedules update instantly across every role.",
  },
];

const ROLES = [
  {
    role: "Student / Club",
    icon: GraduationCap,
    color: "#2563EB",
    gradient: "linear-gradient(135deg, #2563EB, #3B82F6)",
    bg: "#EFF6FF",
    points: [
      "View unified campus calendar",
      "Stay updated with notifications",
      "Track class & exam schedules",
      "View approved campus events",
    ],
  },
  {
    role: "Faculty / Committee",
    icon: BookOpen,
    color: "#6366F1",
    gradient: "linear-gradient(135deg, #6366F1, #818CF8)",
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
    icon: Settings,
    color: "#0F172A",
    gradient: "linear-gradient(135deg, #0F172A, #1E293B)",
    bg: "#F1F5F9",
    points: [
      "Approve or reject proposals",
      "View conflict reports",
      "Manage academic schedule",
      "Monitor all departments",
    ],
  },
];

const FAQS = [
  {
    q: "What is AcadSync?",
    a: "AcadSync is an academic scheduling platform that helps campuses manage events, detect scheduling conflicts, and keep students, faculty, and administrators in sync — all in one place.",
  },
  {
    q: "How does conflict detection work?",
    a: "When an event is proposed, the conflict engine cross-references it against existing lectures, labs, exams, and approved events. It flags conflicts by severity and suggests alternative time slots. Optional AI assist can be enabled through backend configuration.",
  },
  {
    q: "Who can use AcadSync?",
    a: "AcadSync is built for three roles: Students (and clubs) who need to view the campus calendar, Faculty/Committee members who manage lectures and propose events, and Admins who have full control over scheduling and approvals.",
  },
  {
    q: "Is real-time sync available?",
    a: "Yes. AcadSync uses WebSocket technology to push instant updates. When an admin approves or rejects an event, all relevant users receive a real-time in-app notification without needing to refresh.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. AcadSync uses JWT-based authentication, role-based access control, and encrypted data storage. Each user only sees the data their role permits.",
  },
];

const TESTIMONIALS = [
  {
    name: "Aarav Sharma",
    role: "Student, CSE Department",
    avatar: "AS",
    color: "#2563EB",
    text: "Finally, no more missed events because of scheduling chaos. AcadSync notified me the moment the Annual Tech Fest was approved — I was the first to register!",
    stars: 5,
  },
  {
    name: "Dr. Priya Mehta",
    role: "Faculty, Electronics Dept.",
    avatar: "PM",
    color: "#6366F1",
    text: "The conflict detection saved us from a massive clash between the lab exam and a department cultural event. What used to take hours to resolve was flagged and fixed in minutes.",
    stars: 5,
  },
  {
    name: "Rohit Verma",
    role: "Admin, Student Affairs",
    avatar: "RV",
    color: "#22C55E",
    text: "Managing 400+ students' schedules used to be a nightmare. AcadSync's admin panel gives me complete visibility and the conflict reports are incredibly detailed.",
    stars: 5,
  },
];

const METRICS = [
  { value: "100+", label: "Events Managed", icon: Calendar },
  { value: "500+", label: "Students Served", icon: Users },
  { value: "99%", label: "Conflict Resolution Rate", icon: CheckCircle },
  { value: "<2s", label: "Avg. Detection Time", icon: Clock },
];

/* ─────────────── HOOK: Scroll animation ─────────────── */
function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

/* ─────────────── COMPONENT: FAQ Item ─────────────── */
function FaqItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  const [ref, visible] = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`lp-faq-item ${open ? "lp-faq-open" : ""} lp-reveal ${visible ? "lp-reveal-show" : ""}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <button className="lp-faq-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="lp-faq-q">{q}</span>
        <ChevronDown className={`lp-faq-icon ${open ? "lp-faq-icon-open" : ""}`} size={18} />
      </button>
      <div className="lp-faq-body">
        <p className="lp-faq-answer">{a}</p>
      </div>
    </div>
  );
}

/* ─────────────── COMPONENT: Testimonial Carousel ─────────────── */
function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  const [ref, visible] = useScrollReveal();

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  const t = TESTIMONIALS[active];

  return (
    <div ref={ref} className={`lp-testimonial-carousel lp-reveal ${visible ? "lp-reveal-show" : ""}`}>
      <div className="lp-tcard" key={active}>
        <div className="lp-tcard-stars">
          {Array.from({ length: t.stars }).map((_, i) => (
            <Star key={i} size={14} className="lp-star-icon" />
          ))}
        </div>
        <p className="lp-tcard-text">"{t.text}"</p>
        <div className="lp-tcard-author">
          <div className="lp-tcard-avatar" style={{ background: t.color + "22", color: t.color }}>
            {t.avatar}
          </div>
          <div>
            <div className="lp-tcard-name">{t.name}</div>
            <div className="lp-tcard-role">{t.role}</div>
          </div>
        </div>
      </div>
      <div className="lp-carousel-dots">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            className={`lp-carousel-dot ${i === active ? "lp-dot-active" : ""}`}
            onClick={() => setActive(i)}
            aria-label={`Testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────── COMPONENT: Floating particles ─────────────── */
function ParticleField() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 3 + Math.random() * 5,
    dur: 6 + Math.random() * 8,
    delay: Math.random() * 5,
    opacity: 0.15 + Math.random() * 0.25,
  }));

  return (
    <div className="lp-particles" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="lp-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────── MAIN PAGE ─────────────── */
export default function LandingPage() {
  return (
    <div className="lp">

      {/* ══════════ HERO ══════════ */}
      <section className="lp-hero">
        <div className="lp-hero-bg" aria-hidden="true">
          <div className="lp-bg-blob lp-blob-1" />
          <div className="lp-bg-blob lp-blob-2" />
          <div className="lp-bg-blob lp-blob-3" />
          <div className="lp-bg-grid" />
        </div>
        <ParticleField />

        <div className="lp-hero-inner">
          {/* Left: copy */}
          <div className="lp-hero-copy">
            <span className="lp-hero-pill">
              <Zap size={12} style={{ display: "inline", marginRight: 6 }} />
              Smart Academic Scheduler
            </span>
            <h1 className="lp-hero-title">
              Smarter scheduling<br />
              for every <span className="lp-hero-accent">campus role</span>
            </h1>
            <p className="lp-hero-sub">
              AcadSync brings event management, academic timetables, and
              conflict detection into one clean platform — built for students,
              faculty, and administrators.
            </p>

            <div className="lp-hero-actions">
              <Link to="/register" className="lp-btn-primary">
                Get Started Free
                <ArrowRight size={16} className="lp-btn-arrow" />
              </Link>
              <Link to="/login" className="lp-btn-outline">Sign In</Link>
            </div>

            <div className="lp-hero-stats">
              {METRICS.map((m, i) => (
                <div key={m.label} className="lp-stat-item">
                  {i > 0 && <div className="lp-stat-divider" />}
                  <div className="lp-stat">
                    <span className="lp-stat-num">{m.value}</span>
                    <span className="lp-stat-label">{m.label}</span>
                  </div>
                </div>
              ))}
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
                {/* Sidebar */}
                <div className="lp-dash-sidebar">
                  {["Dashboard", "Calendar", "Events", "Schedule", "Conflicts", "Profile"].map((item, i) => (
                    <div key={item} className={`lp-dash-nav-item ${i === 0 ? "lp-dash-nav-active" : ""}`}>
                      {item}
                    </div>
                  ))}
                </div>
                {/* Main area */}
                <div className="lp-dash-main">
                  <div className="lp-dash-heading">Admin Panel</div>
                  <div className="lp-dash-stats">
                    {[
                      { n: "428", l: "Students", c: "#2563EB" },
                      { n: "3",   l: "Pending",  c: "#F97316" },
                      { n: "12",  l: "Approved", c: "#22C55E" },
                      { n: "2",   l: "Conflicts",c: "#EF4444" },
                    ].map((s) => (
                      <div key={s.l} className="lp-dash-stat-card" style={{ borderLeftColor: s.c }}>
                        <span className="lp-dash-stat-num" style={{ color: s.c }}>{s.n}</span>
                        <span className="lp-dash-stat-label">{s.l}</span>
                      </div>
                    ))}
                  </div>
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
            {/* Floating cards */}
            <div className="lp-float-card lp-float-conflict">
              <div className="lp-fc-dot lp-fc-red" />
              <div>
                <div className="lp-fc-title">High Conflict Detected</div>
                <div className="lp-fc-sub">Tech Fest vs DSA Lecture · 09:00–10:00</div>
              </div>
            </div>
            <div className="lp-float-card lp-float-approved">
              <div className="lp-fc-dot lp-fc-green" />
              <div>
                <div className="lp-fc-title">Event Approved ✓</div>
                <div className="lp-fc-sub">Sports Day · Main Ground</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="lp-scroll-hint" aria-hidden="true">
          <div className="lp-scroll-mouse">
            <div className="lp-scroll-wheel" />
          </div>
        </div>
      </section>

      {/* ══════════ METRICS BAND ══════════ */}
      <section className="lp-metrics-band">
        <div className="lp-metrics-inner">
          {METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="lp-metric-item">
                <Icon size={22} className="lp-metric-icon" />
                <span className="lp-metric-value">{m.value}</span>
                <span className="lp-metric-label">{m.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section className="lp-features">
        <SectionHeader
          tag="Platform Features"
          title="Everything your campus needs"
          sub="Powerful tools that keep your academic community in sync."
        />
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} f={f} Icon={f.icon} index={i} />
          ))}
        </div>
      </section>

      {/* ══════════ HOW IT WORKS + ROLES (merged) ══════════ */}
      <section className="lp-how-roles">
        {/* ── Steps sub-section ── */}
        <div className="lp-how-roles-part">
          <SectionHeader
            tag="Quick Start"
            title="How it works"
            sub="Up and running in minutes, not days."
          />
          <div className="lp-steps">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return <StepCard key={s.num} s={s} Icon={Icon} index={i} isLast={i === STEPS.length - 1} />;
            })}
          </div>
        </div>

        {/* ── Visual separator ── */}
        <div className="lp-how-roles-sep" aria-hidden="true">
          <div className="lp-how-roles-sep-line" />
          <span className="lp-how-roles-sep-label">then choose your role</span>
          <div className="lp-how-roles-sep-line" />
        </div>

        {/* ── Roles sub-section ── */}
        <div className="lp-how-roles-part">
          <SectionHeader
            tag="User Roles"
            title="Built for every role"
            sub="One platform, three tailored experiences."
          />
          <div className="lp-roles-grid">
            {ROLES.map((r, i) => <RoleCard key={r.role} r={r} index={i} />)}
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS + FAQ (merged) ══════════ */}
      <section className="lp-social-proof">
        <div className="lp-social-proof-inner">
          {/* Left: Testimonials */}
          <div className="lp-sp-col">
            <div className="lp-sp-col-header">
              <span className="lp-section-tag">Success Stories</span>
              <h2 className="lp-sp-title">Trusted by campuses</h2>
              <p className="lp-sp-sub">Hear from students, faculty, and admins who love AcadSync.</p>
            </div>
            <TestimonialCarousel />
          </div>

          {/* Divider */}
          <div className="lp-sp-divider" aria-hidden="true" />

          {/* Right: FAQ */}
          <div className="lp-sp-col">
            <div className="lp-sp-col-header">
              <span className="lp-section-tag">FAQ</span>
              <h2 className="lp-sp-title">Common questions</h2>
              <p className="lp-sp-sub">Everything you need to know about AcadSync.</p>
            </div>
            <div className="lp-faq-list">
              {FAQS.map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="lp-cta">
        <div className="lp-cta-bg" aria-hidden="true">
          <div className="lp-cta-blob-1" />
          <div className="lp-cta-blob-2" />
          <div className="lp-bg-grid lp-cta-grid" />
        </div>
        <div className="lp-cta-inner">
          <span className="lp-cta-pill">Start for free today</span>
          <h2 className="lp-cta-title">Ready to sync your campus?</h2>
          <p className="lp-cta-sub">
            Join AcadSync and eliminate scheduling conflicts with intelligent checks.
          </p>
          <div className="lp-cta-actions">
            <Link to="/register" className="lp-btn-cta-primary">
              Create Your Account <ArrowRight size={16} style={{ display: "inline", marginLeft: 6 }} />
            </Link>
            <Link to="/login" className="lp-btn-cta-outline">Sign In</Link>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand-col">
            <span className="lp-footer-logo">AcadSync</span>
            <p className="lp-footer-tagline">
              Academic scheduling, reimagined. Conflict-aware planning for modern campuses.
            </p>
            <div className="lp-footer-socials">
              <a href="#" aria-label="GitHub" className="lp-social-link"><Code2 size={16} /></a>
              <a href="#" aria-label="Twitter" className="lp-social-link"><MessageCircle size={16} /></a>
              <a href="#" aria-label="LinkedIn" className="lp-social-link"><Briefcase size={16} /></a>
              <a href="#" aria-label="Email" className="lp-social-link"><Mail size={16} /></a>
            </div>
          </div>

          <div className="lp-footer-links-col">
            <div className="lp-footer-link-group">
              <span className="lp-footer-link-heading">Platform</span>
              <Link to="/login" className="lp-footer-link">Sign In</Link>
              <Link to="/register" className="lp-footer-link">Register</Link>
            </div>
            <div className="lp-footer-link-group">
              <span className="lp-footer-link-heading">Roles</span>
              <span className="lp-footer-link">Students</span>
              <span className="lp-footer-link">Faculty</span>
              <span className="lp-footer-link">Admins</span>
            </div>
            <div className="lp-footer-link-group">
              <span className="lp-footer-link-heading">Legal</span>
              <span className="lp-footer-link">Privacy Policy</span>
              <span className="lp-footer-link">Terms of Use</span>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>© {new Date().getFullYear()} AcadSync. Academic scheduling, reimagined.</p>
          <p>Built with ❤️ for students everywhere.</p>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────── SUB-COMPONENTS ─────────────── */

function SectionHeader({ tag, title, sub }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div ref={ref} className={`lp-section-header lp-reveal ${visible ? "lp-reveal-show" : ""}`}>
      <span className="lp-section-tag">{tag}</span>
      <h2>{title}</h2>
      <p>{sub}</p>
    </div>
  );
}

function FeatureCard({ f, Icon, index }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`lp-feature-card lp-reveal ${visible ? "lp-reveal-show" : ""}`}
      style={{ transitionDelay: `${(index % 3) * 100}ms` }}
    >
      <div className="lp-feature-icon-wrap" style={{ background: f.color + "18", color: f.color }}>
        <Icon size={22} />
      </div>
      <span className="lp-feature-label" style={{ color: f.color, background: f.color + "14" }}>
        {f.label}
      </span>
      <h3 className="lp-feature-title">{f.title}</h3>
      <p className="lp-feature-desc">{f.desc}</p>
      <div className="lp-feature-accent" style={{ background: f.color }} />
    </div>
  );
}

function StepCard({ s, Icon, index, isLast }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`lp-step lp-reveal ${visible ? "lp-reveal-show" : ""}`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="lp-step-icon-wrap">
        <div className="lp-step-num-badge">{s.num}</div>
        <div className="lp-step-icon-circle">
          <Icon size={24} />
        </div>
        {!isLast && <div className="lp-step-connector" />}
      </div>
      <h3 className="lp-step-title">{s.title}</h3>
      <p className="lp-step-desc">{s.desc}</p>
    </div>
  );
}

function RoleCard({ r, index }) {
  const Icon = r.icon;
  const [ref, visible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`lp-role-card lp-reveal ${visible ? "lp-reveal-show" : ""}`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="lp-role-card-header" style={{ background: r.gradient }}>
        <div className="lp-role-icon-circle">
          <Icon size={28} color="#fff" />
        </div>
        <span className="lp-role-title">{r.role}</span>
      </div>
      <ul className="lp-role-list">
        {r.points.map((p) => (
          <li key={p}>
            <CheckCircle size={15} style={{ color: r.color, flexShrink: 0 }} />
            {p}
          </li>
        ))}
      </ul>
      <div className="lp-role-cta">
        <Link to="/register" className="lp-role-btn" style={{ color: r.color, borderColor: r.color + "44" }}>
          Get Started <ArrowRight size={13} style={{ display: "inline", marginLeft: 4 }} />
        </Link>
      </div>
    </div>
  );
}
