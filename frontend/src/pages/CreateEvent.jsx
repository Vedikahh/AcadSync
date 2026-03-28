import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkEventConflicts } from "../services/api";
import { formatTime12h } from "../utils/formatTime";
import "./CreateEvent.css";

const DEPARTMENTS = [
  "COMPS",
  "AIML",
  "AIDS",
  "IOT",
  "Mechanical",
];

const VENUES = [
  "Main Auditorium",
  "Open Air Stage",
  "Conference Hall A",
  "Conference Hall B",
  "Lab Block C",
  "Sports Ground",
  "Library Seminar Room",
  "Online / Virtual",
];

const CATEGORIES = [
  "Technical",
  "Cultural",
  "Sports",
  "Academic",
  "Workshop",
  "Seminar",
  "Club Activity",
  "Other",
];

const EMPTY_FORM = {
  title: "",
  description: "",
  department: "",
  type: "event",
  venue: "",
  date: "",
  startTime: "",
  endTime: "",
  participants: "",
  category: "",
  organizer: "",
};

export default function CreateEvent() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Support returning from conflict page OR editing an existing event
  const getInitialForm = () => {
    const data = location.state?.eventData;
    if (!data) return { ...EMPTY_FORM, organizer: user?.name || "" };

    return {
      ...EMPTY_FORM,
      ...data,
      type: data.type || "event",
      // Ensure date is in YYYY-MM-DD for the input
      date: data.date ? new Date(data.date).toISOString().split('T')[0] : "",
      // Maintain ID if it exists (for editing)
      id: data._id || data.id
    };
  };

  const [form, setForm] = useState(getInitialForm());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.title.trim())       errs.title       = "Event title is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.category)           errs.category    = "Please choose a category";
    if (!form.department)         errs.department  = "Please select a department";
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.date)       errs.date      = "Date is required";
    if (!form.startTime)  errs.startTime = "Start time is required";
    if (!form.endTime)    errs.endTime   = "End time is required";
    if (form.startTime && form.endTime && form.startTime >= form.endTime)
      errs.endTime = "End time must be after start time";
    if (!form.venue)      errs.venue     = "Please select a venue";
    return errs;
  };

  const handleNextStep = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitError("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      setSubmitError("");
      setLoading(true);
      const res = await checkEventConflicts(form);
      const conflicts = res.conflicts || [];
      const blockingConflicts = res.blockingConflicts || [];
      const blocked = Boolean(res.blocked);
      const suggestions = res.suggestions || [];
      const hasConflict = conflicts.length > 0;
      
      const formattedConflicts = conflicts.map((c, i) => {
        const message = typeof c === "string" ? c : c.message;
        const isBlocking = typeof c === "object" && c.isBlocking;
        return ({
          id: i,
          eventName: form.title,
          severity: isBlocking ? "high" : "medium",
          clashWith: message,
          timeOverlap: `${formatTime12h(form.startTime)} – ${formatTime12h(form.endTime)}`,
          venue: form.venue,
          date: form.date,
          affectedStudents: form.participants || "Unknown"
        });
      });

      navigate("/conflict", {
        state: {
          hasConflict,
          blocked,
          blockingConflicts,
          eventData: form,
          conflicts: formattedConflicts,
          suggestions
        },
      });
    } catch (err) {
      setSubmitError(err?.message ? `Failed to check conflicts: ${err.message}` : "Failed to check conflicts. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="ce-page">

      {/* ── Breadcrumb ── */}
      <div className="ce-breadcrumb">
        <Link to="/dashboard" className="ce-bc-link">Dashboard</Link>
        <span className="ce-bc-sep">›</span>
        <span className="ce-bc-current">Create Event</span>
      </div>

      {/* ── Page header ── */}
      <div className="ce-header">
        <div>
          <h1 className="ce-title">Create Event Proposal</h1>
          <p className="ce-sub">Submit your event for admin approval — AcadSync AI checks conflicts automatically</p>
        </div>
      </div>

      {/* ── Step wizard ── */}
      <div className="ce-steps" role="list" aria-label="Create event steps">
        {[
          { num: 1, label: "Event Details",  desc: "Title, category & dept" },
          { num: 2, label: "Schedule & Venue", desc: "Date, time & location" },
        ].map((s, i) => (
          <div key={s.num} className="ce-step-item" role="listitem" aria-current={step === s.num ? "step" : undefined}>
            <div className={`ce-step-circle ${step >= s.num ? "ce-step-active" : ""} ${step > s.num ? "ce-step-done" : ""}`}>
              {step > s.num ? "✓" : s.num}
            </div>
            <div className="ce-step-label-wrap">
              <span className={`ce-step-label ${step >= s.num ? "ce-step-label-active" : ""}`}>{s.label}</span>
              <span className="ce-step-desc">{s.desc}</span>
            </div>
            {i < 1 && <div className={`ce-step-line ${step > 1 ? "ce-step-line-done" : ""}`} />}
          </div>
        ))}
      </div>

      {/* ── MAIN LAYOUT: form + sidebar preview ── */}
      <div className="ce-layout">

        {/* Form card */}
        <div className="ce-card">
          <form onSubmit={handleSubmit} noValidate>

            {submitError && (
              <div className="ce-submit-error" role="alert" aria-live="assertive">
                {submitError}
              </div>
            )}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="ce-step-content">
                <h2 className="ce-section-title">Event Information</h2>

                {/* Title */}
                <div className="ce-field">
                  <label className="ce-label" htmlFor="ce-title">Event Title <span className="ce-req">*</span></label>
                  <input
                    id="ce-title"
                    name="title"
                    type="text"
                    placeholder="e.g. Annual Tech Fest 2025"
                    value={form.title}
                    onChange={handleChange}
                    className={`ce-input ${errors.title ? "ce-input-err" : ""}`}
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? "ce-title-error" : undefined}
                    required
                  />
                  {errors.title && <span className="ce-err" id="ce-title-error">{errors.title}</span>}
                </div>

                {/* Organizer */}
                <div className="ce-field">
                  <label className="ce-label" htmlFor="ce-organizer">Organiser / Club Name</label>
                  <input
                    id="ce-organizer"
                    name="organizer"
                    type="text"
                    placeholder="e.g. IEEE Student Chapter"
                    value={form.organizer}
                    onChange={handleChange}
                    className="ce-input"
                  />
                </div>

                {/* Description */}
                <div className="ce-field">
                  <label className="ce-label" htmlFor="ce-description">Description <span className="ce-req">*</span></label>
                  <textarea
                    id="ce-description"
                    name="description"
                    placeholder="Describe the event — its purpose, activities, and target audience…"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className={`ce-textarea ${errors.description ? "ce-input-err" : ""}`}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={errors.description ? "ce-description-error" : undefined}
                    required
                  />
                  <span className="ce-char-count">{form.description.length} chars</span>
                  {errors.description && <span className="ce-err" id="ce-description-error">{errors.description}</span>}
                </div>

                {/* Category pills */}
                <div className="ce-field">
                  <label className="ce-label">Category <span className="ce-req">*</span></label>
                  {errors.category && <span className="ce-err" id="ce-category-error">{errors.category}</span>}
                  <div className="ce-cat-grid" role="group" aria-label="Select category" aria-describedby={errors.category ? "ce-category-error" : undefined}>
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`ce-cat-pill ${form.category === c ? "ce-cat-active" : ""}`}
                        onClick={() => { setForm((p) => ({ ...p, category: c })); setErrors((p) => ({ ...p, category: "" })); }}
                        aria-pressed={form.category === c}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Department */}
                <div className="ce-field">
                  <label className="ce-label" htmlFor="ce-department">Department / Organising Body <span className="ce-req">*</span></label>
                  <select
                    id="ce-department"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className={`ce-select ${errors.department ? "ce-input-err" : ""}`}
                    aria-invalid={Boolean(errors.department)}
                    aria-describedby={errors.department ? "ce-department-error" : undefined}
                    required
                  >
                    <option value="">— Select department —</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.department && <span className="ce-err" id="ce-department-error">{errors.department}</span>}
                </div>

                <div className="ce-form-actions ce-form-actions-right">
                  <button type="button" className="ce-btn-next" onClick={handleNextStep}>
                    Next: Schedule &amp; Venue
                    <span className="ce-btn-arrow">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="ce-step-content">
                <h2 className="ce-section-title">Schedule &amp; Venue</h2>

                <div className="ce-row">
                  {/* Date */}
                  <div className="ce-field">
                    <label className="ce-label" htmlFor="ce-date">Event Date <span className="ce-req">*</span></label>
                    <input
                      id="ce-date"
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split("T")[0]}
                      className={`ce-input ${errors.date ? "ce-input-err" : ""}`}
                      aria-invalid={Boolean(errors.date)}
                      aria-describedby={errors.date ? "ce-date-error" : undefined}
                      required
                    />
                    {errors.date && <span className="ce-err" id="ce-date-error">{errors.date}</span>}
                  </div>

                  {/* Participants */}
                  <div className="ce-field">
                    <label className="ce-label" htmlFor="ce-participants">Expected Participants</label>
                    <input
                      id="ce-participants"
                      name="participants"
                      type="number"
                      placeholder="e.g. 250"
                      min="1"
                      value={form.participants}
                      onChange={handleChange}
                      className="ce-input"
                    />
                  </div>
                </div>

                <div className="ce-row">
                  {/* Start time */}
                  <div className="ce-field">
                    <label className="ce-label" htmlFor="ce-start-time">Start Time <span className="ce-req">*</span></label>
                    <input
                      id="ce-start-time"
                      name="startTime"
                      type="time"
                      value={form.startTime}
                      onChange={handleChange}
                      className={`ce-input ${errors.startTime ? "ce-input-err" : ""}`}
                      aria-invalid={Boolean(errors.startTime)}
                      aria-describedby={errors.startTime ? "ce-start-time-error" : undefined}
                      required
                    />
                    {errors.startTime && <span className="ce-err" id="ce-start-time-error">{errors.startTime}</span>}
                  </div>

                  {/* End time */}
                  <div className="ce-field">
                    <label className="ce-label" htmlFor="ce-end-time">End Time <span className="ce-req">*</span></label>
                    <input
                      id="ce-end-time"
                      name="endTime"
                      type="time"
                      value={form.endTime}
                      onChange={handleChange}
                      className={`ce-input ${errors.endTime ? "ce-input-err" : ""}`}
                      aria-invalid={Boolean(errors.endTime)}
                      aria-describedby={errors.endTime ? "ce-end-time-error" : undefined}
                      required
                    />
                    {errors.endTime && <span className="ce-err" id="ce-end-time-error">{errors.endTime}</span>}
                  </div>
                </div>

                {/* Venue */}
                <div className="ce-field">
                  <label className="ce-label">Venue <span className="ce-req">*</span></label>
                  <div className="ce-venue-grid" role="group" aria-label="Select venue" aria-describedby={errors.venue ? "ce-venue-error" : undefined}>
                    {VENUES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`ce-venue-pill ${form.venue === v ? "ce-venue-active" : ""}`}
                        onClick={() => { setForm((p) => ({ ...p, venue: v })); setErrors((p) => ({ ...p, venue: "" })); }}
                        aria-pressed={form.venue === v}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  {errors.venue && <span className="ce-err" id="ce-venue-error">{errors.venue}</span>}
                </div>

                {/* AI Notice */}
                <div className="ce-ai-notice">
                  <div className="ce-ai-icon-wrap">AI</div>
                  <div>
                    <p className="ce-ai-title">AI Conflict Detection</p>
                    <p className="ce-ai-desc">
                      AcadSync AI will scan your event against all existing lectures, exams, and approved events.
                      You&apos;ll see results immediately after submission.
                    </p>
                  </div>
                </div>

                <div className="ce-form-actions">
                  <button type="button" className="ce-btn-back" onClick={() => setStep(1)}>
                    ← Back
                  </button>
                  <button type="submit" className="ce-btn-submit" disabled={loading}>
                    {loading ? (
                      <><span className="ce-spinner" /> Checking conflicts…</>
                    ) : (
                      <>Submit &amp; Check Conflicts</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* ── Sidebar preview ── */}
        <div className="ce-sidebar">
          <div className="ce-preview-card">
            <p className="ce-preview-heading">Event Preview</p>

            {form.title ? (
              <>
                <h3 className="ce-preview-title">{form.title}</h3>
                {form.description && (
                  <p className="ce-preview-desc">{form.description.slice(0, 120)}{form.description.length > 120 ? "…" : ""}</p>
                )}
                <div className="ce-preview-chips">
                  {form.category   && <span className="ce-chip ce-chip-blue">{form.category}</span>}
                  {form.department && <span className="ce-chip ce-chip-purple">{form.department.split(" ")[0]}</span>}
                  {form.date       && <span className="ce-chip ce-chip-green">{new Date(form.date + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                  {form.venue      && <span className="ce-chip ce-chip-orange">{form.venue}</span>}
                  {form.startTime && form.endTime && <span className="ce-chip ce-chip-gray">{formatTime12h(form.startTime)} – {formatTime12h(form.endTime)}</span>}
                  {form.participants && <span className="ce-chip ce-chip-gray">{form.participants} participants</span>}
                </div>
              </>
            ) : (
              <div className="ce-preview-empty">
                <p>Fill in the form to see a preview here.</p>
              </div>
            )}
          </div>

          {/* Tips card */}
          <div className="ce-tips-card">
            <p className="ce-tips-heading">Tips for Approval</p>
            <ul className="ce-tips-list">
              <li>Propose at least <strong>2 weeks</strong> in advance</li>
              <li>Include a clear, descriptive title</li>
              <li>Choose the correct department to avoid delays</li>
              <li>Avoid peak exam periods (Oct–Nov, Mar–Apr)</li>
              <li>Check venue availability before submitting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
