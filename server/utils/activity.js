import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (userId, action, details, type = 'info') => {
  try {
    if (!userId) return;
    const log = new ActivityLog({
      userId,
      action,
      details,
      type
    });
    await log.save();
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};
