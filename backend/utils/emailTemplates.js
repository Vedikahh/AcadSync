/**
 * Email template builder for AcadSync notifications
 */

const getBaseTemplate = (body, subject) => {
  const year = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; color: #0F172A; }
        .container { max-width: 600px; margin: 0 auto; background: #F8FAFC; padding: 20px; }
        .header { background: #2563EB; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #94A3B8; }
        .btn { display: inline-block; background: #2563EB; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        .highlight { background: #EFF6FF; padding: 16px; border-left: 4px solid #2563EB; margin: 16px 0; border-radius: 4px; }
        .badge { display: inline-block; background: #E0E7FF; color: #4F46E5; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-right: 8px; }
        h2 { color: #1D4ED8; margin-top: 0; }
        p { margin: 12px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AcadSync</h1>
            <p>${subject}</p>
        </div>
        <div class="content">
            ${body}
        </div>
        <div class="footer">
            <p>© ${year} AcadSync. All rights reserved.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/notification-preferences" style="color: #2563EB; text-decoration: none;">Manage notification preferences</a></p>
        </div>
    </div>
</body>
</html>
  `;
};

const templates = {
  eventNotification: (eventName, eventDetails, actionUrl) => {
    const body = `
<h2>📅 New Event Created</h2>
<p>A new event has been added to your academic calendar.</p>
<div class="highlight">
    <strong>${eventName}</strong><br/>
    ${eventDetails}
</div>
<p><a href="${actionUrl}" class="btn">View Event</a></p>
<p>Make sure to update your calendar accordingly.</p>
    `;
    return getBaseTemplate(body, `New Event: ${eventName}`);
  },

  approvalNotification: (eventName, requesterName, actionUrl) => {
    const body = `
<h2>✅ Event Approval Notification</h2>
<p>Your event has been approved!</p>
<div class="highlight">
    <strong>${eventName}</strong><br/>
    Approved by: ${requesterName}
</div>
<p><a href="${actionUrl}" class="btn">View Details</a></p>
<p>Your event is now visible in the academic schedule.</p>
    `;
    return getBaseTemplate(body, `Event Approved: ${eventName}`);
  },

  rejectionNotification: (eventName, reason, actionUrl) => {
    const body = `
<h2>❌ Event Rejection Notice</h2>
<p>Your event submission has been rejected.</p>
<div class="highlight">
    <strong>${eventName}</strong><br/>
    Reason: ${reason || 'See details for more information'}
</div>
<p><a href="${actionUrl}" class="btn">View Details</a></p>
<p>You can resubmit your event after addressing the feedback.</p>
    `;
    return getBaseTemplate(body, `Event Rejected: ${eventName}`);
  },

  remindNotification: (eventName, eventTime, actionUrl) => {
    const body = `
<h2>⏰ Event Reminder</h2>
<p>Reminder: Your event is coming up soon!</p>
<div class="highlight">
    <strong>${eventName}</strong><br/>
    Starts: ${eventTime}
</div>
<p><a href="${actionUrl}" class="btn">View Event</a></p>
<p>Make the necessary preparations for this event.</p>
    `;
    return getBaseTemplate(body, `Reminder: ${eventName}`);
  },

  conflictNotification: (eventName, conflictDetails, actionUrl) => {
    const body = `
<h2>⚠️ Scheduling Conflict Detected</h2>
<p>A scheduling conflict has been detected with your proposed event.</p>
<div class="highlight">
    <strong>${eventName}</strong><br/>
    ${conflictDetails}
</div>
<p><a href="${actionUrl}" class="btn">Review Conflict</a></p>
<p>Please review and resolve the conflict as soon as possible.</p>
    `;
    return getBaseTemplate(body, `Scheduling Conflict: ${eventName}`);
  },

  systemNotification: (title, message, actionUrl) => {
    const body = `
<h2>${'ℹ️'} ${title}</h2>
<p>${message}</p>
${actionUrl ? `<p><a href="${actionUrl}" class="btn">Learn More</a></p>` : ''}
    `;
    return getBaseTemplate(body, title);
  },
};

module.exports = templates;
