const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const connectDB = require('../lib/db');
const { uploadProfileImage } = require('../middleware/upload');
const router = express.Router();

// Simple test route to check if auth router is loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router is working', timestamp: new Date().toISOString() });
});

// Simple test route for debug users
router.get('/debug/users', (req, res) => {
  res.json({ 
    message: 'Debug endpoint reached', 
    timestamp: new Date().toISOString(),
    env: {
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'NOT SET'
    }
  });
});

// Register new user
router.post('/signup', async (req, res) => {
  try {
    await connectDB();
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user (let pre-save hook hash the password)
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', {
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.url
    });

    await connectDB();
    const { email, password } = req.body;

    console.log('Extracted credentials:', { email: email ? 'provided' : 'missing', password: password ? 'provided' : 'missing' });

    // Validate input
    if (!email || !password) {
      console.log('Validation failed: missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists - only select necessary fields for faster query
    console.log('Searching for user with email:', email);
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User found, checking password...');

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Password verified, creating JWT token...');

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    await connectDB();
    
    // User is already verified by auth middleware, just get the user data
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    await connectDB();
    const { name, email } = req.body;
    
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile image
router.post('/profile-image', auth, uploadProfileImage, async (req, res) => {
  try {
    await connectDB();
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    // Convert image to base64 for storage
    const profileImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Profile image updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to list users (for development only)
router.get('/debug/users', async (req, res) => {
  try {
    console.log('Debug users endpoint called');
    console.log('MongoDB URI status:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
    
    await connectDB();
    console.log('Database connected successfully');
    
    const users = await User.find({}).select('-password');
    console.log('Found users:', users.length);
    
    res.json({
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug users error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Temporary password reset endpoint (for development only)
router.post('/reset-password', async (req, res) => {
  try {
    console.log('Password reset request received');
    await connectDB();
    
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update the password (it will be hashed by the pre-save hook)
    user.password = newPassword;
    await user.save();
    
    console.log('Password reset successful for:', email);
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 