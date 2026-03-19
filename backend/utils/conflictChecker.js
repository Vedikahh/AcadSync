const Event = require('../models/Event');
const Schedule = require('../models/Schedule');

/**
 * Checks if a proposed event overlaps with:
 * 1. Existing approved events OR
 * 2. Regular academic schedule classes
 * 
 * Returns an array of human-readable conflict strings.
 */
const checkConflicts = async (eventDetails) => {
  const { date, startTime, endTime, venue } = eventDetails;
  const conflicts = [];

  // Parse strings to compare easily (e.g "14:30" -> 14.5)
  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m / 60);
  };
  
  const evStart = parseTime(startTime);
  const evEnd = parseTime(endTime);

  // Collect all occupied intervals
  const occupiedIntervals = [];

  // Fetch approved events for the same date and venue
  const existingEvents = await Event.find({
    date,
    venue,
    status: 'approved'
  });

  for (const ev of existingEvents) {
    occupiedIntervals.push({ start: parseTime(ev.startTime), end: parseTime(ev.endTime), name: ev.title });
    if (evStart < parseTime(ev.endTime) && evEnd > parseTime(ev.startTime)) {
      conflicts.push(`Venue clash: Overlaps with approved event "${ev.title}" from ${ev.startTime}-${ev.endTime}.`);
    }
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const eventDayStr = dayNames[new Date(date).getDay()];

  const classes = await Schedule.find({ day: eventDayStr, room: venue });

  for (const cls of classes) {
    occupiedIntervals.push({ start: parseTime(cls.startTime), end: parseTime(cls.endTime), name: cls.subject });
    if (evStart < parseTime(cls.endTime) && evEnd > parseTime(cls.startTime)) {
      conflicts.push(`Academic clash: Overlaps with regular lecture "${cls.subject}" (${cls.faculty}) from ${cls.startTime}-${cls.endTime}.`);
    }
  }

  // Generate suggestions if conflicts exist
  const suggestions = [];
  if (conflicts.length > 0) {
    const duration = evEnd - evStart;
    const workdayStart = 9; // 09:00
    const workdayEnd = 18; // 18:00

    const formatTime = (timeNum) => {
      const h = Math.floor(timeNum);
      const m = Math.round((timeNum - h) * 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    // Find up to 3 gaps
    for (let testStart = workdayStart; testStart <= workdayEnd - duration; testStart += 1) { // step by 1 hr
      const testEnd = testStart + duration;
      const isFree = !occupiedIntervals.some(occ => testStart < occ.end && testEnd > occ.start);
      if (isFree) {
        suggestions.push({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          startTime: formatTime(testStart),
          endTime: formatTime(testEnd),
          label: testStart >= 17 ? 'After classes' : testStart >= 12 && testStart <= 14 ? 'Lunch hours' : 'Available slot'
        });
        if (suggestions.length >= 3) break;
      }
    }
  }

  return { conflicts, suggestions };
};

module.exports = {
  checkConflicts
};
