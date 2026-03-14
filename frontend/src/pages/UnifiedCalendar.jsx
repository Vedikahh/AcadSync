import { useState } from "react";
import { Link } from "react-router-dom";
import "./UnifiedCalendar.css";

const CALENDAR_EVENTS = [
  { id: 1, title: "Annual Tech Fest", date: "2025-11-15", type: "event", status: "approved" },
  { id: 2, title: "DSA Lecture", date: "2025-11-03", type: "lecture", recurrence: "MWF" },
  { id: 3, title: "DBMS Lab", date: "2025-11-05", type: "lab", recurrence: "TuTh" },
  { id: 4, title: "Mid-Semester Exam", date: "2025-11-10", type: "exam" },
  { id: 5, title: "Cultural Night", date: "2025-12-05", type: "event", status: "pending" },
  { id: 6, title: "Hackathon 2025", date: "2025-10-20", type: "event", status: "approved" },
  { id: 7, title: "End-Semester Exam", date: "2025-11-20", type: "exam" },
  { id: 8, title: "Sports Day", date: "2025-11-08", type: "event", status: "approved" },
  { id: 9, title: "Alumni Meet", date: "2025-12-20", type: "event", status: "pending" },
  { id: 10, title: "Software Engg Lecture", date: "2025-11-12", type: "lecture" },
];

const TYPE_CONFIG = {
  lecture: { color: "#6366f1", label: "Lecture", dot: "●" },
  lab:     { color: "#22c55e", label: "Lab",     dot: "●" },
  exam:    { color: "#ef4444", label: "Exam",    dot: "●" },
  event:   { color: "#f97316", label: "Event",   dot: "●" },
};

function getEventsForDate(dateStr) {
  return CALENDAR_EVENTS.filter((e) => e.date === dateStr);
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function UnifiedCalendar() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const [filterType, setFilterType] = useState("all");

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const toDateStr = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isToday = (day) => {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
  };

  const selectedEvents = selected
    ? getEventsForDate(toDateStr(selected)).filter(
        (e) => filterType === "all" || e.type === filterType
      )
    : [];

  return (
    <div className="cal-page">
      {/* Header */}
      <div className="cal-header">
        <div>
          <h1 className="cal-title">📅 Unified Calendar</h1>
          <p className="cal-sub">All lectures, exams and events in one view</p>
        </div>
        <Link to="/create-event" className="cal-create-btn">+ Create Event</Link>
      </div>

      {/* Legend */}
      <div className="cal-legend">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <button
            key={type}
            className={`cal-legend-item ${filterType === type ? "cal-legend-active" : ""}`}
            onClick={() => setFilterType(filterType === type ? "all" : type)}
          >
            <span style={{ color: cfg.color }}>●</span> {cfg.label}
          </button>
        ))}
        <button
          className={`cal-legend-item ${filterType === "all" ? "cal-legend-active" : ""}`}
          onClick={() => setFilterType("all")}
        >
          All
        </button>
      </div>

      {/* Calendar grid */}
      <div className="cal-card">
        {/* Navigator */}
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
          <h2 className="cal-month-label">{MONTH_NAMES[month]} {year}</h2>
          <button className="cal-nav-btn" onClick={nextMonth}>›</button>
        </div>

        {/* Day headers */}
        <div className="cal-grid">
          {DAY_NAMES.map((d) => (
            <div key={d} className="cal-day-header">{d}</div>
          ))}

          {/* Empty cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="cal-cell cal-cell-empty" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = toDateStr(day);
            const dayEvents = getEventsForDate(dateStr).filter(
              (e) => filterType === "all" || e.type === filterType
            );
            const isSelected = selected === day;
            const today = isToday(day);

            return (
              <div
                key={day}
                className={`cal-cell ${today ? "cal-cell-today" : ""} ${isSelected ? "cal-cell-selected" : ""} ${dayEvents.length > 0 ? "cal-cell-has-events" : ""}`}
                onClick={() => setSelected(isSelected ? null : day)}
              >
                <span className="cal-day-num">{day}</span>
                <div className="cal-dots">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className="cal-dot"
                      style={{ background: TYPE_CONFIG[ev.type]?.color || "#888" }}
                      title={ev.title}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="cal-dot-more">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side detail panel */}
      {selected && (
        <div className="cal-detail-panel">
          <div className="cal-detail-header">
            <h3>
              {MONTH_NAMES[month]} {selected}, {year}
            </h3>
            <button className="cal-detail-close" onClick={() => setSelected(null)}>✕</button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="cal-detail-empty">No events on this day.</p>
          ) : (
            <div className="cal-detail-list">
              {selectedEvents.map((ev) => (
                <div key={ev.id} className="cal-detail-item">
                  <span
                    className="cal-detail-dot"
                    style={{ background: TYPE_CONFIG[ev.type]?.color }}
                  />
                  <div>
                    <p className="cal-detail-event-title">{ev.title}</p>
                    <span className="cal-detail-type">{TYPE_CONFIG[ev.type]?.label}</span>
                    {ev.status && (
                      <span className={`cal-detail-status cal-status-${ev.status}`}>
                        {ev.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
