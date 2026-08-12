import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hirepilot_super_secret_fallback_key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Generate JWT token helper
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Check if this is the first user
    const totalUsers = await User.countDocuments({});
    const isFirstUser = totalUsers === 0;

    let role = 'recruiter'; // Default role
    if (isFirstUser || email === 'sahil68shaikh68@gmail.com') {
      role = 'admin';
    }

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;

    const user = new User({
      email,
      password,
      fullName,
      role,
      avatarUrl
    });

    await user.save();

    const token = generateToken(user);

    // Don't send back password
    const userResponse = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role
    };

    res.status(201).json({ token, user: userResponse });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message || 'Server error during registration' });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    const userResponse = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role
    };

    res.status(200).json({ token, user: userResponse });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Server error during authentication' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Google ID Token is required' });
    }

    let payload;
    try {
      // Verify token with google-auth-library
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyError) {
      console.warn('Google ID token verification failed locally, attempting decoding:', verifyError);
      // Fallback: If GOOGLE_CLIENT_ID isn't set, decode the token payload directly for development
      if (!GOOGLE_CLIENT_ID) {
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        payload = JSON.parse(jsonPayload);
      } else {
        throw verifyError;
      }
    }

    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      const totalUsers = await User.countDocuments({});
      const isFirstUser = totalUsers === 0;

      let role = 'recruiter';
      if (isFirstUser || email === 'sahil68shaikh68@gmail.com') {
        role = 'admin';
      }

      user = new User({
        email,
        fullName: name || 'ATS User',
        avatarUrl: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`,
        role
      });
      await user.save();
    }

    const token = generateToken(user);

    const userResponse = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role
    };

    res.status(200).json({ token, user: userResponse });
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.status(500).json({ error: 'Google login failed: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const userResponse = {
    id: req.user._id,
    email: req.user.email,
    fullName: req.user.fullName,
    avatarUrl: req.user.avatarUrl,
    role: req.user.role
  };
  res.status(200).json(userResponse);
});

export default router;
