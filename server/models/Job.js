import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  description: {
    type: String
  },
  skills: [{
    type: String
  }],
  experienceRange: {
    type: String
  },
  hiringManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'draft'],
    default: 'open'
  }
}, {
  timestamps: true
});

export default mongoose.model('Job', JobSchema);
