import express from 'express';
import Interview from '../models/Interview.js';
import Application from '../models/Application.js';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';
import { requireAuth, requireAdminOrRecruiter } from '../middleware/auth.js';
import { logActivity } from '../utils/activity.js';

const router = express.Router();

// Helper to detect conflicts
const checkConflict = async (interviewerId, start, end, excludeInterviewId = null) => {
  const pStart = new Date(start);
  const pEnd = new Date(end);

  const query = {
    participants: interviewerId,
    status: 'scheduled',
    $or: [
      { startTime: { $gte: pStart, $lt: pEnd } },
      { endTime: { $gt: pStart, $lte: pEnd } },
      { $and: [{ startTime: { $lte: pStart } }, { endTime: { $gte: pEnd } }] }
    ]
  };

  if (excludeInterviewId) {
    query._id = { $ne: excludeInterviewId };
  }

  const existing = await Interview.findOne(query);
  return !!existing;
};

// POST /api/interviews/detect-conflicts
router.post('/detect-conflicts', requireAuth, async (req, res) => {
  try {
    const { interviewerId, startTime, endTime, excludeInterviewId } = req.body;
    const hasConflict = await checkConflict(interviewerId, startTime, endTime, excludeInterviewId);
    res.json({ conflict: hasConflict });
  } catch (err) {
    console.error('Detect conflicts error:', err);
    res.status(500).json({ error: 'Failed to verify schedule availability' });
  }
});

// GET /api/interviews
router.get('/', requireAuth, async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'jobId' },
          { path: 'candidateId' }
        ]
      })
      .populate('participants', 'fullName email avatarUrl role')
      .sort({ startTime: 1 });

    const formatted = interviews.map(int => ({
      id: int._id,
      application_id: int.applicationId?._id,
      title: int.title,
      start_time: int.startTime,
      end_time: int.endTime,
      type: int.type,
      status: int.status,
      meeting_link: int.meetingLink,
      location: int.location,
      applications: int.applicationId ? {
        id: int.applicationId._id,
        jobs: int.applicationId.jobId ? {
          id: int.applicationId.jobId._id,
          title: int.applicationId.jobId.title
        } : null,
        candidates: int.applicationId.candidateId ? {
          id: int.applicationId.candidateId._id,
          full_name: int.applicationId.candidateId.fullName
        } : null
      } : null,
      participants: int.participants.map(p => ({
        interviewer_id: p._id,
        profiles: {
          id: p._id,
          full_name: p.fullName,
          email: p.email,
          avatar_url: p.avatarUrl,
          role: p.role
        }
      }))
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch interviews error:', err);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

// GET /api/interviews/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const int = await Interview.findById(req.params.id)
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'jobId' },
          { path: 'candidateId' }
        ]
      })
      .populate('participants', 'fullName email avatarUrl role');

    if (!int) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    const formatted = {
      id: int._id,
      application_id: int.applicationId?._id,
      title: int.title,
      start_time: int.startTime,
      end_time: int.endTime,
      type: int.type,
      status: int.status,
      meeting_link: int.meetingLink,
      location: int.location,
      applications: int.applicationId ? {
        id: int.applicationId._id,
        jobs: int.applicationId.jobId ? {
          id: int.applicationId.jobId._id,
          title: int.applicationId.jobId.title,
          hiring_manager_id: int.applicationId.jobId.hiringManagerId
        } : null,
        candidates: int.applicationId.candidateId ? {
          id: int.applicationId.candidateId._id,
          full_name: int.applicationId.candidateId.fullName,
          email: int.applicationId.candidateId.email
        } : null
      } : null,
      participants: int.participants.map(p => ({
        interviewer_id: p._id,
        profiles: {
          id: p._id,
          full_name: p.fullName,
          email: p.email,
          avatar_url: p.avatarUrl,
          role: p.role
        }
      }))
    };

    res.json(formatted);
  } catch (err) {
    console.error('Fetch interview error:', err);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
});

// POST /api/interviews
router.post('/', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const { applicationId, title, startTime, endTime, type, status, meetingLink, location, participants } = req.body;

    const interview = new Interview({
      applicationId,
      title,
      startTime,
      endTime,
      type,
      status,
      meetingLink,
      location,
      participants
    });

    await interview.save();

    const app = await Application.findById(applicationId).populate('candidateId');
    await logActivity(
      req.user._id,
      'Interview Scheduled',
      `Scheduled ${type} interview for candidate ${app?.candidateId?.fullName || 'Candidate'}`,
      'success'
    );

    res.status(201).json(interview);
  } catch (err) {
    console.error('Create interview error:', err);
    res.status(500).json({ error: 'Failed to schedule interview: ' + err.message });
  }
});

// PUT /api/interviews/:id
router.put('/:id', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const { title, startTime, endTime, type, status, meetingLink, location, participants } = req.body;

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (title !== undefined) interview.title = title;
    if (startTime !== undefined) interview.startTime = startTime;
    if (endTime !== undefined) interview.endTime = endTime;
    if (type !== undefined) interview.type = type;
    if (status !== undefined) interview.status = status;
    if (meetingLink !== undefined) interview.meetingLink = meetingLink;
    if (location !== undefined) interview.location = location;
    if (participants !== undefined) interview.participants = participants;

    await interview.save();

    await logActivity(
      req.user._id,
      'Interview Updated',
      `Updated details of interview: ${interview.title}`,
      'info'
    );

    res.json(interview);
  } catch (err) {
    console.error('Update interview error:', err);
    res.status(500).json({ error: 'Failed to update interview: ' + err.message });
  }
});

// DELETE /api/interviews/:id
router.delete('/:id', requireAuth, requireAdminOrRecruiter, async (req, res) => {
  try {
    const interview = await Interview.findByIdAndDelete(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    await logActivity(req.user._id, 'Interview Cancelled', `Deleted/Cancelled interview: ${interview.title}`, 'warning');

    res.json({ message: 'Interview deleted successfully' });
  } catch (err) {
    console.error('Delete interview error:', err);
    res.status(500).json({ error: 'Failed to delete interview' });
  }
});

// GET /api/interviews/:id/feedback
router.get('/:id/feedback', requireAuth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ interviewId: req.params.id })
      .populate('interviewerId', 'fullName email avatarUrl role');

    const formatted = feedbacks.map(fb => ({
      id: fb._id,
      interview_id: fb.interviewId,
      interviewer_id: fb.interviewerId?._id,
      rating: fb.rating,
      comments: fb.comments,
      created_at: fb.createdAt,
      profiles: fb.interviewerId ? {
        id: fb.interviewerId._id,
        full_name: fb.interviewerId.fullName,
        email: fb.interviewerId.email,
        avatar_url: fb.interviewerId.avatarUrl,
        role: fb.interviewerId.role
      } : null
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch feedback error:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// POST /api/interviews/:id/feedback
router.post('/:id/feedback', requireAuth, async (req, res) => {
  try {
    const { interviewerId, rating, comments } = req.body;

    const feedback = new Feedback({
      interviewId: req.params.id,
      interviewerId: interviewerId || req.user._id,
      rating,
      comments
    });

    await feedback.save();

    await logActivity(
      req.user._id,
      'Feedback Submitted',
      `Interviewer submitted feedback rating of ${rating}/5`,
      'success'
    );

    res.status(201).json(feedback);
  } catch (err) {
    console.error('Create feedback error:', err);
    res.status(500).json({ error: 'Failed to submit feedback: ' + err.message });
  }
});

export default router;
