const Event = require('../models/Event');
const Schedule = require('../models/Schedule');

const PRIORITY_MAP = {
  exam: 3,
  lecture: 2,
  lab: 2,
  event: 1,
};

const PRIORITY_LABEL = {
  3: 'Critical',
  2: 'High',
  1: 'Normal',
};

const DEFAULT_WORKDAY_START = 9 * 60;  // 09:00
const DEFAULT_WORKDAY_END = 18 * 60;  // 18:00
const SUGGESTION_STEP_MIN = 30;

const pad2 = (num) => String(num).padStart(2, '0');

const toMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return (h * 60) + m;
};

const normalizeDateKey = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
};

const buildDateRangeUtc = (dateKey) => {
  const start = new Date(`${dateKey}T00:00:00.000Z`);
  const end = new Date(`${dateKey}T23:59:59.999Z`);
  return { start, end };
};

const getPriority = (type) => PRIORITY_MAP[String(type || '').toLowerCase()] || PRIORITY_MAP.event;

const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
};

const toIsoFromDateKey = (dateKey) => {
  if (!dateKey) return null;
  const iso = new Date(`${dateKey}T00:00:00.000Z`);
  return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
};

const overlapWindow = (aStart, aEnd, bStart, bEnd) => {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return {
    startTime: formatTime(start),
    endTime: formatTime(end),
  };
};

const getBlockingReason = ({ title, type, startTime, endTime, priority }) =>
  `${String(type || 'event').toUpperCase()} "${title}" (${startTime}-${endTime}) has ${PRIORITY_LABEL[priority] || 'higher'} priority and blocks this proposal.`;

const overlap = (aStart, aEnd, bStart, bEnd) =>
  aStart < bEnd && aEnd > bStart;

/**
 * Checks if a proposed event overlaps with existing schedules:
 * 1) Approved events on the same date
 * 2) Academic schedule entries (lectures/labs/exams) on the same date or same weekday
 *
 * Returns conflict details, blocking conflicts (higher priority), and suggestions.
 */
const checkConflicts = async (eventDetails) => {
  const { date, startTime, endTime, type, excludeEventId } = eventDetails;

  const dateKey = normalizeDateKey(date);
  const evStart = toMinutes(startTime);
  const evEnd = toMinutes(endTime);

  if (!dateKey || !Number.isFinite(evStart) || !Number.isFinite(evEnd)) {
    return { conflicts: [], blockingConflicts: [], suggestions: [], hasConflict: false, blocked: false };
  }

  const { start: dayStartUtc, end: dayEndUtc } = buildDateRangeUtc(dateKey);
  const eventDayStr = new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString('en-US', { weekday: 'long' });
  const incomingPriority = getPriority(type || 'event');

  const eventQuery = {
    date: { $gte: dayStartUtc, $lte: dayEndUtc },
    status: { $in: ['approved', 'pending'] },
  };

  if (excludeEventId) {
    eventQuery._id = { $ne: excludeEventId };
  }

  const [existingEvents, schedules] = await Promise.all([
    Event.find(eventQuery).lean(),
    Schedule.find({
      $or: [
        { date: { $gte: dayStartUtc, $lte: dayEndUtc } },
        { date: { $exists: false }, day: eventDayStr },
        { date: null, day: eventDayStr }
      ]
    }).lean()
  ]);

  const conflicts = [];
  const blockingConflicts = [];
  const occupiedIntervals = [];
  const dateIso = toIsoFromDateKey(dateKey);

  // Existing approved events (one-off)
  for (const ev of existingEvents) {
    const evType = ev.type || 'event';
    const evPriority = getPriority(evType);
    const evStartMin = toMinutes(ev.startTime);
    const evEndMin = toMinutes(ev.endTime);
    if (!Number.isFinite(evStartMin) || !Number.isFinite(evEndMin)) continue;

    occupiedIntervals.push({ start: evStartMin, end: evEndMin });

    if (overlap(evStart, evEnd, evStartMin, evEndMin)) {
      const message = `Overlaps with ${evType} "${ev.title}" from ${ev.startTime}-${ev.endTime}.`;
      const conflictWindow = overlapWindow(evStart, evEnd, evStartMin, evEndMin);
      const isBlocking = evPriority > incomingPriority;
      const conflict = {
        source: 'event',
        type: evType,
        title: ev.title,
        date: dateKey,
        dateIso,
        startTime: ev.startTime,
        endTime: ev.endTime,
        priority: evPriority,
        message,
        isBlocking,
        conflictWindow,
        blockingReason: isBlocking
          ? getBlockingReason({
            title: ev.title,
            type: evType,
            startTime: ev.startTime,
            endTime: ev.endTime,
            priority: evPriority,
          })
          : null,
      };
      conflicts.push(conflict);
      if (conflict.isBlocking) blockingConflicts.push(conflict);
    }
  }

  // Academic schedule entries (recurring or dated)
  for (const cls of schedules) {
    const clsType = cls.type || 'lecture';
    const clsPriority = getPriority(clsType);
    const clsStart = toMinutes(cls.startTime);
    const clsEnd = toMinutes(cls.endTime);
    if (!Number.isFinite(clsStart) || !Number.isFinite(clsEnd)) continue;

    occupiedIntervals.push({ start: clsStart, end: clsEnd });

    if (overlap(evStart, evEnd, clsStart, clsEnd)) {
      const displayTitle = cls.title || cls.subject || 'Schedule Slot';
      const message = `Overlaps with ${clsType} "${displayTitle}" from ${cls.startTime}-${cls.endTime}.`;
      const conflictWindow = overlapWindow(evStart, evEnd, clsStart, clsEnd);
      const isBlocking = clsPriority > incomingPriority;
      const conflict = {
        source: 'schedule',
        type: clsType,
        title: displayTitle,
        date: dateKey,
        dateIso,
        startTime: cls.startTime,
        endTime: cls.endTime,
        priority: clsPriority,
        message,
        isBlocking,
        conflictWindow,
        blockingReason: isBlocking
          ? getBlockingReason({
            title: displayTitle,
            type: clsType,
            startTime: cls.startTime,
            endTime: cls.endTime,
            priority: clsPriority,
          })
          : null,
      };
      conflicts.push(conflict);
      if (conflict.isBlocking) blockingConflicts.push(conflict);
    }
  }

  const suggestions = [];
  if (conflicts.length > 0 && evEnd > evStart) {
    const duration = evEnd - evStart;

    const intervals = occupiedIntervals
      .filter((i) => Number.isFinite(i.start) && Number.isFinite(i.end) && i.end > i.start)
      .map((i) => ({
        start: Math.max(DEFAULT_WORKDAY_START, i.start),
        end: Math.min(DEFAULT_WORKDAY_END, i.end),
      }))
      .filter((i) => i.end > i.start)
      .sort((a, b) => a.start - b.start);

    const merged = [];
    for (const interval of intervals) {
      const last = merged[merged.length - 1];
      if (!last || interval.start > last.end) {
        merged.push({ ...interval });
      } else {
        last.end = Math.max(last.end, interval.end);
      }
    }

    let cursor = DEFAULT_WORKDAY_START;
    const gaps = [];
    for (const interval of merged) {
      if (interval.start > cursor) {
        gaps.push({ start: cursor, end: interval.start });
      }
      cursor = Math.max(cursor, interval.end);
    }
    if (cursor < DEFAULT_WORKDAY_END) {
      gaps.push({ start: cursor, end: DEFAULT_WORKDAY_END });
    }

    for (const gap of gaps) {
      for (let start = gap.start; start + duration <= gap.end; start += SUGGESTION_STEP_MIN) {
        const end = start + duration;
        const label = start >= 17 * 60
          ? 'After classes'
          : start >= 12 * 60 && start <= 14 * 60
            ? 'Lunch hours'
            : start < 12 * 60
              ? 'Morning slot'
              : 'Available slot';

        suggestions.push({
          date: new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          startTime: formatTime(start),
          endTime: formatTime(end),
          label
        });

        if (suggestions.length >= 3) break;
      }
      if (suggestions.length >= 3) break;
    }
  }

  return {
    conflicts,
    blockingConflicts,
    suggestions,
    hasConflict: conflicts.length > 0,
    blocked: blockingConflicts.length > 0
  };
};

module.exports = {
  checkConflicts
};
