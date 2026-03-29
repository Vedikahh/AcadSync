const schedule = require('node-schedule');
const Event = require('../models/Event');
const User = require('../models/User');
const { createNotificationsForUsers } = require('../controllers/notificationController');

const REMINDER_JOBS = new Map();

/**
 * Schedule a reminder for an event 24 hours before start
 * @param {Object} event - Event document with _id, title, date, startTime, department, createdBy
 */
const scheduleEventReminder = (event) => {
  if (!event || !event.date || !event.startTime) return;

  const eventId = String(event._id);
  
  // Cancel existing job if any
  if (REMINDER_JOBS.has(eventId)) {
    const existingJob = REMINDER_JOBS.get(eventId);
    if (existingJob) existingJob.cancel();
  }

  // Combine date and startTime to get event start datetime
  const [hours, minutes] = event.startTime.split(':').map(Number);
  const eventStart = new Date(event.date);
  eventStart.setHours(hours, minutes, 0, 0);

  const remindTime = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000); // 24 hours before

  // Skip if reminder time is in the past
  if (remindTime < new Date()) {
    return;
  }

  try {
    const job = schedule.scheduleJob(eventId, remindTime, async () => {
      try {
        console.log(`[EventReminderJob] Sending 24h reminder for event: ${event.title}`);
        
        // Get organizer and all students in the department
        const [organizer, departmentUsers] = await Promise.all([
          event.createdBy ? User.findById(event.createdBy).select('_id') : null,
          User.find({ department: event.department }).select('_id'),
        ]);

        let attendeeIds = departmentUsers.map((u) => u._id);
        
        // Make sure organizer is included
        if (organizer && !attendeeIds.find((id) => String(id) === String(organizer._id))) {
          attendeeIds.push(organizer._id);
        }

        if (attendeeIds.length === 0) {
          console.log(`[EventReminderJob] No attendees found for event: ${event.title}`);
          REMINDER_JOBS.delete(eventId);
          return;
        }

        const eventDate = eventStart.toLocaleString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        await createNotificationsForUsers({
          userIds: attendeeIds,
          message: `Reminder: ${event.title} starts in 24 hours`,
          type: 'reminder',
          link: `/events/${eventId}`,
          payloadBuilder: () => ({
            eventName: event.title,
            eventTime: eventDate,
            eventId,
          }),
        });

        // Remove job from memory after execution
        REMINDER_JOBS.delete(eventId);
      } catch (error) {
        console.error(`[EventReminderJob] Error sending reminder for ${event.title}:`, error.message);
      }
    });

    REMINDER_JOBS.set(eventId, job);
    console.log(`[EventReminderJob] Scheduled reminder for "${event.title}" at ${remindTime.toISOString()}`);
  } catch (error) {
    console.error(`[EventReminderJob] Failed to schedule reminder:`, error.message);
  }
};

/**
 * Cancel a scheduled reminder for an event
 * @param {string} eventId - Event document ID
 */
const cancelEventReminder = (eventId) => {
  const job = REMINDER_JOBS.get(String(eventId));
  if (job) {
    job.cancel();
    REMINDER_JOBS.delete(String(eventId));
    console.log(`[EventReminderJob] Cancelled reminder for event: ${eventId}`);
  }
};

/**
 * Initialize all pending event reminders (run on server startup)
 */
const initializeReminders = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all events starting within the next 30 days
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingEvents = await Event.find({
      date: {
        $gte: today,
        $lte: thirtyDaysFromNow,
      },
      status: 'approved', // Only approved events
    }).select('_id title date startTime department createdBy');

    console.log(
      `[EventReminderJob] Initializing reminders for ${upcomingEvents.length} upcoming events`
    );

    upcomingEvents.forEach((event) => {
      scheduleEventReminder(event);
    });
  } catch (error) {
    console.error('[EventReminderJob] Failed to initialize reminders:', error.message);
  }
};

module.exports = {
  scheduleEventReminder,
  cancelEventReminder,
  initializeReminders,
  getActiveJobs: () => REMINDER_JOBS.size,
};
