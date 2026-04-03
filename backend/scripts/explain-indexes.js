require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Schedule = require('../models/Schedule');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const extractStage = (winningPlan = {}) => {
  if (winningPlan.stage) return winningPlan.stage;
  if (winningPlan.inputStage?.stage) return winningPlan.inputStage.stage;
  if (Array.isArray(winningPlan.inputStages) && winningPlan.inputStages[0]?.stage) return winningPlan.inputStages[0].stage;
  return 'UNKNOWN';
};

const printPlan = (label, plan) => {
  const stage = extractStage(plan?.queryPlanner?.winningPlan || {});
  const keys = plan?.executionStats?.totalKeysExamined;
  const docs = plan?.executionStats?.totalDocsExamined;
  console.log(`${label}: stage=${stage}, keysExamined=${keys}, docsExamined=${docs}`);
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const [eventPlan, schedulePlan, notificationPlan, auditPlan] = await Promise.all([
      Event.find({
        status: 'approved',
        date: { $gte: new Date('2026-01-01'), $lte: new Date('2026-12-31') },
      }).explain('executionStats'),
      Schedule.find({ day: 'Monday' }).explain('executionStats'),
      Notification.find({ type: 'system' }).explain('executionStats'),
      AuditLog.find({ action: 'event.update' }).explain('executionStats'),
    ]);

    printPlan('Event(status,date)', eventPlan);
    printPlan('Schedule(day)', schedulePlan);
    printPlan('Notification(type)', notificationPlan);
    printPlan('AuditLog(action)', auditPlan);
  } catch (error) {
    console.error('Explain check failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
