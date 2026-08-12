import express from 'express';
import Job from '../models/Job.js';
import { requireAuth, requireAdminOrRecruiter } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const status = req.query.status;
    const filter = {};
    if (status) {
      filter.status = status;
    }
    const jobs = await Job.find(filter).populate('hiringManagerId', 'fullName email avatarUrl role').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error('Fetch jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('hiringManagerId', 'fullName email avatarUrl role');
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (err) {
    console.error('Fetch job error:', err);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /api/jobs
router.post('/', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const { title, department, description, skills, experienceRange, hiringManagerId, status } = req.body;

    const job = new Job({
      title,
      department,
      description,
      skills,
      experienceRange,
      hiringManagerId: hiringManagerId || req.user._id,
      status: status || 'open'
    });

    await job.save();

    await logActivity(req.user._id, 'Job Created', `Created job posting: ${title}`, 'success');

    res.status(201).json(job);
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ error: 'Failed to create job: ' + err.message });
  }
});

// PUT /api/jobs/:id
router.put('/:id', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const { title, department, description, skills, experienceRange, hiringManagerId, status } = req.body;

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { title, department, description, skills, experienceRange, hiringManagerId, status },
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await logActivity(req.user._id, 'Job Updated', `Updated job posting: ${job.title}`, 'info');

    res.json(job);
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ error: 'Failed to update job: ' + err.message });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await logActivity(req.user._id, 'Job Deleted', `Deleted job posting: ${job.title}`, 'warning');

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router;
