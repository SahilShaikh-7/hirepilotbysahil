import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    // Optional because OAuth (Google login) users might not have a password
  },
  fullName: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['admin', 'recruiter', 'interviewer', 'candidate'],
    default: 'recruiter', // Default is recruiter as per handle_new_user logic (except first user or specific email)
  },
}, {
  timestamps: true,
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
