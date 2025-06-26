const express = require('express');
const cors = require('cors');
const connectDB = require('../lib/db');
const Pigeon = require('../models/Pigeon');
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

// Get all pigeons
app.get('/', auth, async (req, res) => {
  try {
    await ensureDBConnection();
    
    const pigeons = await Pigeon.find({ user: req.user.userId });
    res.json(pigeons);
  } catch (error) {
    console.error('Get pigeons error:', error);
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ message: 'Service temporarily unavailable' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Create pigeon
app.post('/', auth, async (req, res) => {
  try {
    await ensureDBConnection();
    
    const pigeon = new Pigeon({
      ...req.body,
      user: req.user.userId
    });
    
    await pigeon.save();
    res.status(201).json(pigeon);
  } catch (error) {
    console.error('Create pigeon error:', error);
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ message: 'Service temporarily unavailable' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single pigeon
app.get('/:id', auth, async (req, res) => {
  try {
    await ensureDBConnection();
    
    const pigeon = await Pigeon.findOne({
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!pigeon) {
      return res.status(404).json({ message: 'Pigeon not found' });
    }
    
    res.json(pigeon);
  } catch (error) {
    console.error('Get pigeon error:', error);
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ message: 'Service temporarily unavailable' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update pigeon
app.put('/:id', auth, async (req, res) => {
  try {
    await ensureDBConnection();
    
    const pigeon = await Pigeon.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      req.body,
      { new: true }
    );
    
    if (!pigeon) {
      return res.status(404).json({ message: 'Pigeon not found' });
    }
    
    res.json(pigeon);
  } catch (error) {
    console.error('Update pigeon error:', error);
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ message: 'Service temporarily unavailable' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete pigeon
app.delete('/:id', auth, async (req, res) => {
  try {
    await ensureDBConnection();
    
    const pigeon = await Pigeon.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!pigeon) {
      return res.status(404).json({ message: 'Pigeon not found' });
    }
    
    res.json({ message: 'Pigeon deleted' });
  } catch (error) {
    console.error('Delete pigeon error:', error);
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ message: 'Service temporarily unavailable' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = app; 