import express from 'express';
import Candidate from '../models/Candidate.js';
import { requireAuth, requireAdminOrRecruiter } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();

// GET /api/candidates
router.get('/', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    console.error('Fetch candidates error:', err);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// GET /api/candidates/:id
router.get('/:id', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    res.json(candidate);
  } catch (err) {
    console.error('Fetch candidate error:', err);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

// POST /api/candidates
router.post('/', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const { fullName, email, phone, resumeUrl, linkedinUrl, professionalRole, source } = req.body;

    // Check if candidate already exists
    let candidate = await Candidate.findOne({ email });
    if (candidate) {
      return res.status(400).json({ error: 'Candidate with this email already exists' });
    }

    candidate = new Candidate({
      fullName,
      email,
      phone,
      resumeUrl,
      linkedinUrl,
      professionalRole,
      source
    });

    await candidate.save();

    await logActivity(req.user._id, 'Candidate Added', `Added candidate: ${fullName}`, 'success');

    res.status(201).json(candidate);
  } catch (err) {
    console.error('Create candidate error:', err);
    res.status(500).json({ error: 'Failed to add candidate: ' + err.message });
  }
});

// PUT /api/candidates/:id
router.put('/:id', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const { fullName, email, phone, resumeUrl, linkedinUrl, professionalRole, source } = req.body;

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { fullName, email, phone, resumeUrl, linkedinUrl, professionalRole, source },
      { new: true, runValidators: true }
    );

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    await logActivity(req.user._id, 'Candidate Updated', `Updated candidate profile: ${candidate.fullName}`, 'info');

    res.json(candidate);
  } catch (err) {
    console.error('Update candidate error:', err);
    res.status(500).json({ error: 'Failed to update candidate: ' + err.message });
  }
});

// DELETE /api/candidates/:id
router.delete('/:id', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    await logActivity(req.user._id, 'Candidate Deleted', `Deleted candidate: ${candidate.fullName}`, 'warning');

    res.json({ message: 'Candidate deleted successfully' });
  } catch (err) {
    console.error('Delete candidate error:', err);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

export default router;
