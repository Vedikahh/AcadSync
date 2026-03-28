import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSchedules, getEvents } from "../services/api";
import socket from "../services/socket";
import { formatTime12h } from "../utils/formatTime";
import "./UnifiedCalendar.css";

const Icons = {
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

const TYPE_CONFIG = {
  lecture: { color: "#3B82F6", label: "Lecture" },
  lab:     { color: "#10B981", label: "Lab" },
  exam:    { color: "#EF4444", label: "Exam" },
  event:   { color: "#8B5CF6", label: "Event" },
};

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
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [calendarItems, setCalendarItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";
  const isOrganizer = user?.role === "organizer";
  const canCreateEvent = isOrganizer;
  const currentUserId = user?._id || user?.id;

  const roleDescription = isAdmin
    ? "Admin view: includes approved, pending, and rejected events."
    : isOrganizer
      ? "Organizer view: approved events plus your own pending/rejected requests."
      : "Student view: approved events and academic schedule entries.";

  const normalizeDateKey = (value) => {
    if (!value) return "";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
  };

  const fetchCalendarData = () => {
    setIsLoading(true);
    setError("");
    Promise.all([
      getEvents().catch(() => []),
      getSchedules().catch(() => [])
    ]).then(([eventsData, schedData]) => {
      // Map one-off Events
      const mappedEvents = Array.isArray(eventsData) ? eventsData.map((e) => ({
        id: e._id || e.id,
        title: e.title,
        date: normalizeDateKey(e.date),
        type: e.type || "event",
        source: "event",
        status: e.status || "pending",
        department: e.department,
        venue: e.venue,
        startTime: e.startTime,
        endTime: e.endTime,
        createdById: e.createdBy?._id || e.createdBy || null,
        createdByName: e.createdBy?.name || "Unknown"
      })) : [];

      // Map recurring Weekly Schedules (Ex: Lectures, Labs)
      const schedules = Array.isArray(schedData) ? schedData : [];
      const mappedSchedules = schedules.map((s) => ({
        id: s._id || s.id,
        title: s.subject || "Untitled Class",
        day: s.day,
        date: normalizeDateKey(s.date),
        type: s.type || "lecture",
        source: "schedule",
        department: s.department,
        faculty: s.faculty,
        venue: s.room,
        room: s.room,
        startTime: s.startTime,
        endTime: s.endTime
      }));
      
      setCalendarItems([...mappedEvents, ...mappedSchedules]);
      setIsLoading(false);
    }).catch((err) => {
      console.error("Failed to load calendar data", err);
      setError("Unable to load calendar data right now. Please try again.");
      setCalendarItems([]);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchCalendarData();

    // Socket Listener
    socket.on('calendarUpdate', () => {
      console.log('Calendar update received via socket');
      fetchCalendarData();
    });

    return () => {
      socket.off('calendarUpdate');
    }
  }, []);


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

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return calendarItems.filter((item) => {
      const isSchedule = item.source === "schedule";
      const isApprovedEvent = item.status === "approved";
      const isOwnedByOrganizer = isOrganizer && item.createdById && item.createdById.toString() === currentUserId;

      if (!isSchedule && !isAdmin && !isApprovedEvent && !isOwnedByOrganizer) {
        return false;
      }

      if (statusFilter !== "all") {
        if (isSchedule) return false;
        if (item.status !== statusFilter) return false;
      }

      if (!q) return true;

      const searchableText = [
        item.title,
        item.department,
        item.venue,
        item.room,
        item.faculty,
        item.createdByName,
      ].filter(Boolean).join(" ").toLowerCase();

      return searchableText.includes(q);
    });
  }, [calendarItems, searchQuery, statusFilter, isAdmin, isOrganizer, currentUserId]);

  const monthlyStats = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
    const totalEvents = visibleItems.filter((i) => i.source === "event").length;
    const totalSchedules = visibleItems.filter((i) => i.source === "schedule").length;
    const monthlyOneOffEvents = visibleItems.filter((i) => i.source === "event" && i.date?.startsWith(monthPrefix)).length;

    return {
      totalEvents,
      totalSchedules,
      monthlyOneOffEvents,
    };
  }, [visibleItems, year, month]);

  // Combines explicitly dated items with repeating day items for a specific UI month/day
  const getEventsForDate = (dateStr, dayNum, items = visibleItems) => {
    const curDate = new Date(year, month, dayNum);
    const dayOfWeek = curDate.toLocaleDateString("en-US", { weekday: "long" }); // "Monday"

    return items.filter((item) => {
      // Direct date match (Event APIs or dated schedules)
      if (item.date) return item.date === dateStr;
      // Day of week match (recurring schedules only)
      if (item.day) return item.day === dayOfWeek;
      return false;
    }).map((match) => ({
      ...match,
      type: match.type || "lecture", // Fallback to lecture for generic schedule records
      title: match.title || match.subject || "Untitled Class"
    }));
  };

  const isToday = (day) => {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
  };

  const selectedEvents = selected
    ? getEventsForDate(toDateStr(selected), selected).filter((e) => filterType === "all" || e.type === filterType)
    : [];

  return (
    <div className="cal-page-bg">
      <div className="cal-page-container">
        
        {/* Header */}
        <div className="cal-header">
          <div className="cal-title-wrapper">
            <h1 className="cal-title">Unified Calendar</h1>
            <p className="cal-sub">All lectures, exams, and campus events in one master view.</p>
            <p className="cal-role-sub">{roleDescription}</p>
          </div>
          <div className="cal-header-actions">
            <Link to="/events" className="cal-secondary-btn">
              View Events
            </Link>
            {canCreateEvent && (
              <Link to="/create-event" className="cal-create-btn">
                <span className="cal-btn-icon"><Icons.Plus /></span>
                Create Event
              </Link>
            )}
          </div>
        </div>

        <div className="cal-summary-strip">
          <div className="cal-summary-item">
            <span className="cal-summary-label">Visible One-off Events (This Month)</span>
            <strong>{monthlyStats.monthlyOneOffEvents}</strong>
          </div>
          <div className="cal-summary-item">
            <span className="cal-summary-label">Visible Event Records</span>
            <strong>{monthlyStats.totalEvents}</strong>
          </div>
          <div className="cal-summary-item">
            <span className="cal-summary-label">Recurring Schedule Slots</span>
            <strong>{monthlyStats.totalSchedules}</strong>
          </div>
        </div>

        {/* Legend / Action Bar */}
        <div className="cal-action-bar">
          <div className="cal-search-wrap">
            <label htmlFor="calendar-search" className="cal-sr-only">Search calendar</label>
            <input
              id="calendar-search"
              className="cal-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, venue, department, faculty..."
              aria-label="Search calendar items"
            />
          </div>

          <div className="cal-status-filters" role="group" aria-label="Filter by event status">
            {[
              { key: "all", label: "All Status" },
              { key: "approved", label: "Approved" },
              { key: "pending", label: "Pending" },
              { key: "rejected", label: "Rejected" },
            ].map((status) => (
              <button
                key={status.key}
                className={`cal-status-pill ${statusFilter === status.key ? "cal-status-active" : ""}`}
                onClick={() => setStatusFilter(status.key)}
                aria-pressed={statusFilter === status.key}
              >
                {status.label}
              </button>
            ))}
          </div>

          <div className="cal-legend-filters" role="group" aria-label="Filter by item type">
            <button
              className={`cal-legend-pill ${filterType === "all" ? "cal-legend-active" : ""}`}
              onClick={() => setFilterType("all")}
              aria-pressed={filterType === "all"}
            >
              All Types
            </button>
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
              <button
                key={type}
                className={`cal-legend-pill ${filterType === type ? "cal-legend-active" : ""}`}
                onClick={() => setFilterType(filterType === type ? "all" : type)}
                aria-pressed={filterType === type}
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

              {error && (
                <div className="cal-inline-state cal-inline-error" role="alert">
                  <p>{error}</p>
                  <button type="button" onClick={fetchCalendarData}>Retry</button>
                </div>
              )}

              {!error && !isLoading && visibleItems.length === 0 && (
                <div className="cal-inline-state" role="status" aria-live="polite">
                  No calendar entries match your current filters.
                </div>
              )}

              {/* Grid Header */}
              <div className="cal-grid-scroll" role="region" aria-label="Monthly calendar grid" tabIndex={0}>
                <div className="cal-grid" role="grid" aria-label={`${MONTH_NAMES[month]} ${year}`}>
                {DAY_NAMES.map((d) => (
                  <div key={d} className="cal-day-header" role="columnheader" aria-label={d}>{d}</div>
                ))}

                {/* Empty cells */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="cal-cell cal-cell-empty" role="presentation" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = toDateStr(day);
                  const dayEvents = getEventsForDate(dateStr, day, visibleItems).filter(
                    (e) => filterType === "all" || e.type === filterType
                  );
                  const isSelected = selected === day;
                  const today = isToday(day);

                  return (
                    <button
                      type="button"
                      key={day}
                      className={`cal-cell ${today ? "cal-cell-today" : ""} ${isSelected ? "cal-cell-selected" : ""} ${dayEvents.length > 0 ? "cal-cell-has-events" : ""}`}
                      onClick={() => setSelected(isSelected ? null : day)}
                      aria-label={`${MONTH_NAMES[month]} ${day}, ${year}. ${dayEvents.length} item${dayEvents.length === 1 ? "" : "s"}.`}
                      aria-pressed={isSelected}
                      aria-current={today ? "date" : undefined}
                      role="gridcell"
                    >
                      <div className="cal-cell-top">
                        <span className="cal-day-num">{day}</span>
                      </div>
                      
                      {dayEvents.length > 0 && !isLoading && (
                        <div className="cal-events-stack">
                          {dayEvents.slice(0, 3).map((ev, index) => {
                            const uniqueKey = ev.id ? `${ev.id}-${index}` : `event-${index}`;
                            return (
                              <div
                                key={uniqueKey}
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
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <span className="cal-more-label">+{dayEvents.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
                </div>
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
                {isLoading ? (
                  <div className="cal-detail-empty" role="status" aria-live="polite">
                    <p>Loading database calendar elements...</p>
                  </div>
                ) : !selected ? (
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
                    {selectedEvents.map((ev, idx) => {
                      const uniqueKey = ev.id ? `${ev.id}-det-${idx}` : `detail-${idx}`;
                      return (
                        <div key={uniqueKey} className="cal-detail-item">
                          <div 
                            className="cal-detail-line" 
                            style={{ background: TYPE_CONFIG[ev.type]?.color }}
                          />
                          <div className="cal-detail-content">
                            <p className="cal-detail-title">{ev.title}</p>
                            <div className="cal-detail-meta">
                              <span 
                                className="cal-detail-badge"
                                style={{ backgroundColor: TYPE_CONFIG[ev.type]?.color + "1A", color: TYPE_CONFIG[ev.type]?.color }}
                              >
                                {TYPE_CONFIG[ev.type]?.label}
                              </span>
                              {ev.department && <span className="meta-item">{ev.department}</span>}
                              {(ev.venue || ev.room) && <span className="meta-item">{ev.venue || ev.room}</span>}
                              {ev.faculty && <span className="meta-item">{ev.faculty}</span>}
                              {ev.createdByName && isAdmin && ev.source === "event" && (
                                <span className="meta-item">By {ev.createdByName}</span>
                              )}
                              {ev.startTime && ev.endTime && (
                                <span className="meta-item cal-detail-time">
                                  ⏱ {formatTime12h(ev.startTime)} - {formatTime12h(ev.endTime)}
                                </span>
                              )}
                              {ev.status && (
                                <span className={`meta-item cal-detail-status status-${ev.status}`}>
                                  {ev.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
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
