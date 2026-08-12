import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  resumeUrl: {
    type: String
  },
  linkedinUrl: {
    type: String
  },
  professionalRole: {
    type: String
  },
  source: {
    type: String,
    default: 'Direct'
  }
}, {
  timestamps: true
});

export default mongoose.model('Candidate', CandidateSchema);
