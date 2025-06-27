const express = require('express');
const Pigeon = require('../models/Pigeon');
const { auth } = require('../middleware/auth');
const connectDB = require('../lib/db');
const { uploadPigeonImages } = require('../middleware/upload');
const router = express.Router();

// Middleware to ensure database connection
const ensureDBConnection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ message: 'Database connection failed' });
  }
};

// Get all pigeons for the authenticated user
router.get('/', auth, ensureDBConnection, async (req, res) => {
  try {
    const pigeons = await Pigeon.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(pigeons);
  } catch (error) {
    console.error('Error fetching pigeons:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single pigeon
router.get('/:id', auth, ensureDBConnection, async (req, res) => {
  try {
    const pigeon = await Pigeon.findById(req.params.id);
    
    if (!pigeon) {
      return res.status(404).json({ message: 'Pigeon not found' });
    }
    
    // Check if pigeon belongs to user
    if (pigeon.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.json(pigeon);
  } catch (error) {
    console.error('Error fetching pigeon:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new pigeon
router.post('/', auth, ensureDBConnection, uploadPigeonImages, async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    console.log('req.user:', req.user);

    const { name, ringNumber, dateOfBirth, color, sex, strain, breeder, notes, fatherName, motherName } = req.body;
    // Use pigeonImage if uploaded
    let pigeonImage = '';
    if (req.files && req.files.pigeonImage && req.files.pigeonImage[0]) {
      pigeonImage = req.files.pigeonImage[0].originalname; // or handle as needed
    }

    if (!name) {
      return res.status(400).json({ message: 'Pigeon name is required.' });
    }
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    const pigeon = new Pigeon({
      name,
      ringNumber,
      dateOfBirth,
      color,
      sex,
      strain,
      breeder,
      notes,
      fatherName,
      motherName,
      pigeonImage,
      user: req.user.userId
    });

    await pigeon.save();
    res.status(201).json(pigeon);
  } catch (error) {
    console.error('Error creating pigeon:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update pigeon
router.put('/:id', auth, ensureDBConnection, async (req, res) => {
  try {
    let pigeon = await Pigeon.findById(req.params.id);
    
    if (!pigeon) {
      return res.status(404).json({ message: 'Pigeon not found' });
    }
    
    // Check if pigeon belongs to user
    if (pigeon.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    pigeon = await Pigeon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json(pigeon);
  } catch (error) {
    console.error('Error updating pigeon:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete pigeon
router.delete('/:id', auth, ensureDBConnection, async (req, res) => {
  try {
    const pigeon = await Pigeon.findById(req.params.id);
    
    if (!pigeon) {
      return res.status(404).json({ message: 'Pigeon not found' });
    }
    
    // Check if pigeon belongs to user
    if (pigeon.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await Pigeon.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Pigeon removed' });
  } catch (error) {
    console.error('Error deleting pigeon:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 