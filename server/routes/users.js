import express from 'express';
import User from '../models/User.js';
import { requireAuth, requireAdmin, requireAdminOrRecruiter } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();

// GET /api/users
router.get('/', requireAuth, async (req, res) => {
  try {
    const role = req.query.role; // Optional role filter
    const filter = {};
    if (role) {
      if (Array.isArray(role)) {
        filter.role = { $in: role };
      } else if (typeof role === 'string' && role.includes(',')) {
        filter.role = { $in: role.split(',') };
      } else {
        filter.role = role;
      }
    }
    
    const users = await User.find(filter).select('-password').sort({ fullName: 1 });
    
    // Map output to profile object properties
    const formatted = users.map(u => ({
      id: u._id,
      email: u.email,
      full_name: u.fullName,
      avatar_url: u.avatarUrl,
      role: u.role,
      created_at: u.createdAt
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/users/:id/role
router.put('/:id/role', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['admin', 'recruiter', 'interviewer', 'candidate'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logActivity(
      req.user._id,
      'User Role Updated',
      `Changed role of ${user.fullName} to ${role}`,
      'warning'
    );

    res.json({
      id: user._id,
      email: user.email,
      full_name: user.fullName,
      avatar_url: user.avatarUrl,
      role: user.role,
      created_at: user.createdAt
    });
  } catch (err) {
    console.error('Update user role error:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
