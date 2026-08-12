import express from 'express';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';
import { requireAuth, requireAdminOrRecruiter } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();

// GET /api/applications
router.get('/', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('jobId')
      .populate('candidateId')
      .sort({ createdAt: -1 });

    // Format output to match Supabase's returned structure where jobs and candidates are sub-objects
    const formatted = applications.map(app => ({
      id: app._id,
      job_id: app.jobId?._id,
      candidate_id: app.candidateId?._id,
      status: app.status,
      current_stage_index: app.currentStageIndex,
      notes: app.notes,
      created_at: app.createdAt,
      jobs: app.jobId ? {
        id: app.jobId._id,
        title: app.jobId.title,
        department: app.jobId.department,
        status: app.jobId.status
      } : null,
      candidates: app.candidateId ? {
        id: app.candidateId._id,
        full_name: app.candidateId.fullName,
        email: app.candidateId.email,
        phone: app.candidateId.phone,
        resume_url: app.candidateId.resumeUrl,
        linkedin_url: app.candidateId.linkedinUrl,
        professional_role: app.candidateId.professionalRole,
        source: app.candidateId.source
      } : null
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/applications/:id
router.get('/:id', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('jobId')
      .populate('candidateId');

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const formatted = {
      id: app._id,
      job_id: app.jobId?._id,
      candidate_id: app.candidateId?._id,
      status: app.status,
      current_stage_index: app.currentStageIndex,
      notes: app.notes,
      created_at: app.createdAt,
      jobs: app.jobId ? {
        id: app.jobId._id,
        title: app.jobId.title,
        department: app.jobId.department,
        status: app.jobId.status
      } : null,
      candidates: app.candidateId ? {
        id: app.candidateId._id,
        full_name: app.candidateId.fullName,
        email: app.candidateId.email,
        phone: app.candidateId.phone,
        resume_url: app.candidateId.resumeUrl,
        linkedin_url: app.candidateId.linkedinUrl,
        professional_role: app.candidateId.professionalRole,
        source: app.candidateId.source
      } : null
    };

    res.json(formatted);
  } catch (err) {
    console.error('Fetch application error:', err);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// POST /api/applications
router.post('/', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const { jobId, candidateId, status, currentStageIndex, notes } = req.body;

    if (!jobId || !candidateId) {
      return res.status(400).json({ error: 'Job ID and Candidate ID are required' });
    }

    const existing = await Application.findOne({ jobId, candidateId });
    if (existing) {
      return res.status(400).json({ error: 'This candidate has already applied to this job' });
    }

    const app = new Application({
      jobId,
      candidateId,
      status,
      currentStageIndex,
      notes
    });

    await app.save();

    const job = await Job.findById(jobId);
    const candidate = await Candidate.findById(candidateId);

    await logActivity(
      req.user._id, 
      'Application Created', 
      `Candidate ${candidate?.fullName || 'Unknown'} applied to ${job?.title || 'Unknown Job'}`, 
      'success'
    );

    res.status(201).json(app);
  } catch (err) {
    console.error('Create application error:', err);
    res.status(500).json({ error: 'Failed to submit application: ' + err.message });
  }
});

// PUT /api/applications/:id
router.put('/:id', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const { status, currentStageIndex, notes } = req.body;

    const app = await Application.findById(req.params.id)
      .populate('jobId')
      .populate('candidateId');

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const oldStatus = app.status;

    if (status) app.status = status;
    if (currentStageIndex !== undefined) app.currentStageIndex = currentStageIndex;
    if (notes !== undefined) app.notes = notes;

    await app.save();

    if (status && status !== oldStatus) {
      await logActivity(
        req.user._id,
        'Application Stage Change',
        `Changed stage of ${app.candidateId?.fullName || 'Candidate'} for ${app.jobId?.title || 'Job'} to: ${status}`,
        'info'
      );
    } else {
      await logActivity(
        req.user._id,
        'Application Updated',
        `Updated notes/stage details for ${app.candidateId?.fullName || 'Candidate'}`,
        'info'
      );
    }

    res.json(app);
  } catch (err) {
    console.error('Update application error:', err);
    res.status(500).json({ error: 'Failed to update application: ' + err.message });
  }
});

// DELETE /api/applications/:id
router.delete('/:id', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const app = await Application.findByIdAndDelete(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application deleted successfully' });
  } catch (err) {
    console.error('Delete application error:', err);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export default router;
