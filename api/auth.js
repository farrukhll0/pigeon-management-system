const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const connectDB = require('../lib/db');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Connect to database
let dbConnected = false;
const ensureDBConnection = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Database connection failed');
    }
  }
};

// Register
app.post('/register', async (req, res) => {
  try {
    await ensureDBConnection();
    
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ message: 'Service temporarily unavailable' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    await ensureDBConnection();
    
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ message: 'Service temporarily unavailable' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
app.get('/profile', auth, async (req, res) => {
  try {
    await ensureDBConnection();
    
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ message: 'Service temporarily unavailable' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = app; 