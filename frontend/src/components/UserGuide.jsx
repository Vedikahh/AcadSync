import { useState } from "react";
import { BookOpen, X, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import "./UserGuide.css";

const GUIDES = {
  student: {
    title: "Student Guide",
    color: "#7c3aed",
    bg: "#f5f3ff",
    steps: [
      {
        icon: "🎓",
        title: "Welcome to Your Student Portal",
        desc: "This is your personal hub for tracking everything happening on campus. You'll see today's schedule, upcoming events, and important notifications — all in one place.",
      },
      {
        icon: "📅",
        title: "View Today's Schedule",
        desc: "The 'Today's Schedule' card shows your lectures and campus events for the current day, color-coded and sorted by time.",
      },
      {
        icon: "🔔",
        title: "Stay Updated with Notifications",
        desc: "The notifications panel keeps you informed. Click a notification to mark it read. For the full inbox, click 'Inbox →'.",
      },
      {
        icon: "📌",
        title: "Browse Upcoming Events",
        desc: "Scroll down to 'Upcoming Events' to see all approved campus activities sorted by date. Click 'Browse Events' in the top bar for the full events wall.",
      },
      {
        icon: "🗓️",
        title: "Use Quick Links",
        desc: "Use the 'Academic Calendar' and 'My Profile' quick links for fast access to your timetable and account settings.",
      },
    ],
  },
  organizer: {
    title: "Organizer Guide",
    color: "#2563eb",
    bg: "#eff6ff",
    steps: [
      {
        icon: "📋",
        title: "Welcome, Organizer!",
        desc: "Your dashboard is your command center for managing lectures and planning campus events. Use the three tabs to navigate between your schedule, conflicts, and events.",
      },
      {
        icon: "📚",
        title: "Today's Schedule Tab",
        desc: "The 'Today's Schedule' tab shows all classes on the timeline for today — helping you understand which time slots are occupied before you plan an event.",
      },
      {
        icon: "⚠️",
        title: "Action Needed Tab",
        desc: "The 'Action Needed' tab flags conflicts between your events and the academic schedule. A red badge shows the count of unresolved conflicts.",
      },
      {
        icon: "📣",
        title: "Requesting a New Event",
        desc: "Click 'Request New Event' in Quick Actions to open the event creation wizard. AcadSync will automatically run a conflict check as you fill in the date and time.",
      },
      {
        icon: "✅",
        title: "Tracking Approvals",
        desc: "After submitting, check the 'Upcoming Events' tab to see the status of your proposals. You'll also receive a real-time notification when the admin takes action.",
      },
    ],
  },
  admin: {
    title: "Admin Guide",
    color: "#0f172a",
    bg: "#f1f5f9",
    steps: [
      {
        icon: "🛡️",
        title: "Welcome to the Admin Command Center",
        desc: "You have full institutional control. This dashboard gives you a live overview of all events, pending approvals, schedule conflicts, department activity, and system audit logs.",
      },
      {
        icon: "✅",
        title: "Processing Pending Approvals",
        desc: "The 'Pending Approvals' section shows all event proposals awaiting your review. Click Approve or Reject on each card. You'll be prompted to add an optional note or rejection reason.",
      },
      {
        icon: "🚨",
        title: "Resolving Conflicts",
        desc: "The 'Active Conflict Reports' table flags events with scheduling clashes. Click 'Resolve' next to any entry to open the Conflict Resolver tool for that specific event.",
      },
      {
        icon: "📊",
        title: "Department Activity Chart",
        desc: "The bar chart shows event volume per department. Use it to spot which departments are most active and whether any require attention.",
      },
      {
        icon: "📜",
        title: "Reading the System Logs",
        desc: "The 'System Logs' panel is a real-time audit trail. Every approval, rejection, import, or schedule change is logged here with the actor, timestamp, and entity affected.",
      },
    ],
  },
};

// ── Modal-only export (used internally) ───────────────
function GuideModal({ guide, onClose }) {
  const [step, setStep] = useState(0);
  const currentStep = guide.steps[step];
  const total = guide.steps.length;

  return (
    <div className="ug-overlay" onClick={onClose}>
      <div
        className="ug-modal"
        style={{ "--ug-color": guide.color, "--ug-bg": guide.bg }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ug-header" style={{ background: guide.color }}>
          <div className="ug-header-left">
            <BookOpen size={18} color="#fff" />
            <span className="ug-header-title">{guide.title}</span>
          </div>
          <button className="ug-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Progress dots */}
        <div className="ug-progress" style={{ background: guide.bg }}>
          {guide.steps.map((_, i) => (
            <button
              key={i}
              className={`ug-dot ${i === step ? "ug-dot-active" : i < step ? "ug-dot-done" : ""}`}
              style={i <= step ? { background: guide.color, borderColor: guide.color } : {}}
              onClick={() => setStep(i)}
              aria-label={`Step ${i + 1}`}
            >
              {i < step && <CheckCircle size={10} color="#fff" />}
            </button>
          ))}
        </div>

        {/* Step content */}
        <div className="ug-body" key={step}>
          <div className="ug-step-icon">{currentStep.icon}</div>
          <h3 className="ug-step-title">{currentStep.title}</h3>
          <p className="ug-step-desc">{currentStep.desc}</p>
        </div>

        {/* Footer nav */}
        <div className="ug-footer">
          <span className="ug-step-counter">Step {step + 1} of {total}</span>
          <div className="ug-nav-btns">
            <button
              className="ug-btn-secondary"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            {step < total - 1 ? (
              <button
                className="ug-btn-primary"
                style={{ background: guide.color }}
                onClick={() => setStep((s) => s + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="ug-btn-primary ug-btn-done"
                style={{ background: guide.color }}
                onClick={onClose}
              >
                Done <CheckCircle size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Navbar inline button (exported for Navbar use) ────
export function NavGuideButton({ role }) {
  const [open, setOpen] = useState(false);
  const guide = GUIDES[role];
  if (!guide) return null;

  return (
    <>
      <button
        className="navbar-guide-btn"
        style={{ "--ug-color": guide.color }}
        onClick={() => setOpen(true)}
        aria-label="Open user guide"
      >
        <BookOpen size={15} />
        <span>Guide</span>
      </button>

      {open && <GuideModal guide={guide} onClose={() => setOpen(false)} />}
    </>
  );
}

// ── Default export kept for any legacy usage ──────────
export default function UserGuide({ role }) {
  const [open, setOpen] = useState(false);
  const guide = GUIDES[role];
  if (!guide) return null;

  return (
    <>
      {open && <GuideModal guide={guide} onClose={() => setOpen(false)} />}
    </>
  );
}
