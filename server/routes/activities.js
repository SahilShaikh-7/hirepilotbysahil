import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { requireAuth, requireAdminOrRecruiter } from '../middleware/auth.js';

const router = express.Router();

// GET /api/activities
router.get('/', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const logs = await ActivityLog.find()
      .populate('userId', 'fullName email avatarUrl')
      .sort({ createdAt: -1 })
      .limit(limit);

    const formatted = logs.map(log => ({
      id: log._id,
      user_id: log.userId?._id,
      action: log.action,
      details: log.details,
      type: log.type,
      created_at: log.createdAt
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch activities error:', err);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router;
