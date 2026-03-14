import { useState } from "react";
import { Link } from "react-router-dom";
import "./UnifiedCalendar.css";

const Icons = {
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

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
  lecture: { color: "#3B82F6", label: "Lecture" },
  lab:     { color: "#10B981", label: "Lab" },
  exam:    { color: "#EF4444", label: "Exam" },
  event:   { color: "#8B5CF6", label: "Event" },
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
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelected(null);
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
    <div className="cal-page-bg">
      <div className="cal-page-container">
        
        {/* Header */}
        <div className="cal-header">
          <div className="cal-title-wrapper">
            <h1 className="cal-title">Unified Calendar</h1>
            <p className="cal-sub">All lectures, exams, and campus events in one master view.</p>
          </div>
          <Link to="/create-event" className="cal-create-btn">
            <span className="cal-btn-icon"><Icons.Plus /></span>
            Create Event
          </Link>
        </div>

        {/* Legend / Action Bar */}
        <div className="cal-action-bar">
          <div className="cal-legend-filters">
            <button
              className={`cal-legend-pill ${filterType === "all" ? "cal-legend-active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              All Types
            </button>
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
              <button
                key={type}
                className={`cal-legend-pill ${filterType === type ? "cal-legend-active" : ""}`}
                onClick={() => setFilterType(filterType === type ? "all" : type)}
              >
                <span className="cal-legend-dot" style={{ background: cfg.color }} />
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Card Layout */}
        <div className="cal-layout-grid">
          
          {/* Main Grid */}
          <div className="cal-main-col">
            <div className="cal-card">
              
              {/* Month Navigator */}
              <div className="cal-nav">
                <button className="cal-nav-btn" onClick={prevMonth} aria-label="Previous Month">
                  <Icons.ChevronLeft />
                </button>
                <div className="cal-month-display">
                  <Icons.Calendar />
                  <h2 className="cal-month-label">{MONTH_NAMES[month]} {year}</h2>
                </div>
                <button className="cal-nav-btn" onClick={nextMonth} aria-label="Next Month">
                  <Icons.ChevronRight />
                </button>
              </div>

              {/* Grid Header */}
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
                      <div className="cal-cell-top">
                        <span className="cal-day-num">{day}</span>
                      </div>
                      
                      {dayEvents.length > 0 && (
                        <div className="cal-events-stack">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <div
                              key={ev.id}
                              className="cal-event-bar"
                              style={{ 
                                backgroundColor: TYPE_CONFIG[ev.type]?.color + "1A", // 10% opacity
                                color: TYPE_CONFIG[ev.type]?.color,
                                borderLeftColor: TYPE_CONFIG[ev.type]?.color 
                              }}
                              title={ev.title}
                            >
                              {ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="cal-more-label">+{dayEvents.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Details Sidebar panel */}
          <div className="cal-side-col">
            <div className="cal-detail-panel">
              <div className="cal-detail-header">
                <h3>
                  {selected ? `${MONTH_NAMES[month]} ${selected}, ${year}` : "Select a Date"}
                </h3>
                {selected && (
                  <button className="cal-detail-close" onClick={() => setSelected(null)}>
                    <Icons.Close />
                  </button>
                )}
              </div>
              
              <div className="cal-detail-body">
                {!selected ? (
                  <div className="cal-detail-empty">
                    <div className="cal-empty-icon"><Icons.Calendar /></div>
                    <p>Click on any date in the calendar to view its scheduled events, lectures, and exams.</p>
                  </div>
                ) : selectedEvents.length === 0 ? (
                  <div className="cal-detail-empty">
                    <p>No events scheduled on this day.</p>
                  </div>
                ) : (
                  <div className="cal-detail-list">
                    {selectedEvents.map((ev) => (
                      <div key={ev.id} className="cal-detail-item">
                        <div 
                          className="cal-detail-line" 
                          style={{ background: TYPE_CONFIG[ev.type]?.color }}
                        />
                        <div className="cal-detail-content">
                          <p className="cal-detail-title">{ev.title}</p>
                          <div className="cal-detail-meta">
                            <span 
                              className="cal-detail-type"
                              style={{ color: TYPE_CONFIG[ev.type]?.color }}
                            >
                              {TYPE_CONFIG[ev.type]?.label}
                            </span>
                            {ev.status && (
                              <span className={`cal-detail-status status-${ev.status}`}>
                                • {ev.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
