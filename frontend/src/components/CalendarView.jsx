import { useState } from "react";
import "./CalendarView.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_COLORS = {
  approved: "#48c9b0",
  pending: "#f6a623",
  rejected: "#e57373",
};

/** Build a YYYY-MM-DD string from year/month(0-based)/day */
function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarView({ events = [] }) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(null);
  };

  const getEventsForDay = (day) => {
    const dateStr = toDateStr(year, month, day);
    return events.filter((e) => e.date === dateStr);
  };

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  // Build calendar grid cells (null = empty leading cell)
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="calendar-view">
      {/* Header */}
      <div className="cal-header">
        <button className="cal-nav-btn" onClick={prevMonth} aria-label="Previous month">
          &#8249;
        </button>
        <div className="cal-title-group">
          <span className="cal-title">
            {MONTHS[month]} {year}
          </span>
          <button className="cal-today-btn" onClick={goToday}>
            Today
          </button>
        </div>
        <button className="cal-nav-btn" onClick={nextMonth} aria-label="Next month">
          &#8250;
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="cal-days-header">
        {DAYS.map((d) => (
          <div key={d} className="cal-day-label">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="cal-grid">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="cal-cell cal-cell-empty" />;
          }
          const dayEvents = getEventsForDay(day);
          const isSelected = selectedDay === day;
          return (
            <div
              key={day}
              className={[
                "cal-cell",
                isToday(day) ? "cal-cell-today" : "",
                isSelected ? "cal-cell-selected" : "",
                dayEvents.length > 0 ? "cal-cell-has-events" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedDay(isSelected ? null : day)}
              aria-label={`${MONTHS[month]} ${day}, ${year}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ""}`}
            >
              <span className="cal-date-num">{day}</span>
              <div className="cal-event-pills">
                {dayEvents.slice(0, 2).map((ev) => (
                  <span
                    key={ev.id}
                    className="cal-event-pill"
                    style={{ background: STATUS_COLORS[ev.status] || STATUS_COLORS.approved }}
                    title={ev.title}
                  >
                    {ev.title.length > 12 ? ev.title.slice(0, 11) + "…" : ev.title}
                  </span>
                ))}
                {dayEvents.length > 2 && (
                  <span className="cal-event-more">+{dayEvents.length - 2} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day details */}
      {selectedDay && (
        <div className="cal-day-detail">
          <div className="cal-detail-header">
            <span className="cal-detail-date">
              {MONTHS[month]} {selectedDay}, {year}
            </span>
            <button
              className="cal-detail-close"
              onClick={() => setSelectedDay(null)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          {selectedDayEvents.length === 0 ? (
            <p className="cal-no-events">No events scheduled for this day.</p>
          ) : (
            <div className="cal-detail-events">
              {selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="cal-detail-event-item"
                  style={{ borderLeftColor: STATUS_COLORS[ev.status] || STATUS_COLORS.approved }}
                >
                  <div className="cal-detail-event-title">{ev.title}</div>
                  <div className="cal-detail-event-meta">
                    {ev.startTime && (
                      <span>
                        🕐 {ev.startTime}
                        {ev.endTime ? ` – ${ev.endTime}` : ""}
                      </span>
                    )}
                    {ev.venue && <span>📍 {ev.venue}</span>}
                    {ev.organizer && <span>👤 {ev.organizer}</span>}
                    <span
                      className={`cal-status-badge cal-status-${ev.status}`}
                    >
                      {ev.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="cal-legend">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="cal-legend-item">
            <span className="cal-legend-dot" style={{ background: color }} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}
