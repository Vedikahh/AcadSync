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

  // 1. Check existing Approved events on the exact same date & venue
  const existingEvents = await Event.find({
    date: new Date(date),
    venue: venue,
    status: 'approved'
  });

  for (const ev of existingEvents) {
    const exStart = parseTime(ev.startTime);
    const exEnd = parseTime(ev.endTime);

    // Overlap condition:
    // Event A starts before B ends AND Event A ends after B starts
    if (evStart < exEnd && evEnd > exStart) {
      conflicts.push(`Venue clash: Overlaps with approved event "${ev.title}" from ${ev.startTime}-${ev.endTime}.`);
    }
  }

  // 2. Check regular academic schedule
  // Convert JS date to day string (e.g "Monday")
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const eventDayStr = dayNames[new Date(date).getDay()];

  const classes = await Schedule.find({
    day: eventDayStr,
    room: venue
  });

  for (const cls of classes) {
    const clStart = parseTime(cls.startTime);
    const clEnd = parseTime(cls.endTime);

    if (evStart < clEnd && evEnd > clStart) {
      conflicts.push(`Academic clash: Overlaps with regular lecture "${cls.subject}" (${cls.faculty}) from ${cls.startTime}-${cls.endTime}.`);
    }
  }

  return conflicts;
};

module.exports = {
  checkConflicts
};
