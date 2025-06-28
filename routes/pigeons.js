const express = require('express');
const Pigeon = require('../models/Pigeon');
const { auth } = require('../middleware/auth');
const connectDB = require('../lib/db');
const { uploadPigeonImages, uploadSingle } = require('../middleware/upload');
const router = express.Router();

// Get all pigeons for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    await connectDB();
    const pigeons = await Pigeon.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(pigeons);
  } catch (error) {
    console.error('Error fetching pigeons:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single pigeon
router.get('/:id', auth, async (req, res) => {
  try {
    await connectDB();
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

// Upload image and return base64 data URL
router.post('/upload-image', auth, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const file = req.file;
    console.log('Image uploaded:', file.originalname, file.mimetype, file.size);

    // Convert to base64
    const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    res.json({
      message: 'Image uploaded successfully',
      imageData: base64Data,
      filename: file.originalname,
      size: file.size,
      type: file.mimetype
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Image upload failed' });
  }
});

// Create new pigeon
router.post('/', auth, async (req, res) => {
  try {
    await connectDB();
    
    console.log('Pigeon creation request received');
    console.log('Request body:', req.body);
    
    const { 
      name, ringNumber, dateOfBirth, color, sex, strain, breeder, notes, 
      fatherName, motherName, pigeonImage, fatherImage, motherImage 
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Pigeon name is required.' });
    }
    if (!req.user || !req.user.id) {
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
      pigeonImage: pigeonImage || '',
      fatherImage: fatherImage || '',
      motherImage: motherImage || '',
      user: req.user.id
    });

    console.log('Saving pigeon:', pigeon.name);
    console.log('Has images:', {
      pigeonImage: !!pigeonImage,
      fatherImage: !!fatherImage,
      motherImage: !!motherImage
    });

    await pigeon.save();
    console.log('Pigeon saved successfully');
    res.status(201).json(pigeon);
  } catch (error) {
    console.error('Error creating pigeon:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update pigeon
router.put('/:id', auth, async (req, res) => {
  try {
    await connectDB();
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
router.delete('/:id', auth, async (req, res) => {
  try {
    await connectDB();
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