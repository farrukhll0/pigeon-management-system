const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { uploadPigeonImages } = require('../middleware/upload');
const Pigeon = require('../models/Pigeon');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/pigeons
// @desc    Get all pigeons for the authenticated user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const pigeons = await Pigeon.find({ user: req.user._id })
            .sort({ createdAt: -1 });
        
        res.json(pigeons);
    } catch (error) {
        console.error('Get pigeons error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/pigeons/:id
// @desc    Get a specific pigeon by ID
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const pigeon = await Pigeon.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!pigeon) {
            return res.status(404).json({ message: 'Pigeon not found' });
        }

        res.json(pigeon);
    } catch (error) {
        console.error('Get pigeon error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Pigeon not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/pigeons
// @desc    Create a new pigeon with images
// @access  Private
router.post('/', uploadPigeonImages, [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),
    body('ringNumber')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Ring number cannot be more than 50 characters'),
    body('color')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Color cannot be more than 50 characters'),
    body('sex')
        .optional()
        .isIn(['Male', 'Female', 'Unknown'])
        .withMessage('Sex must be Male, Female, or Unknown'),
    body('strain')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Strain cannot be more than 100 characters'),
    body('breeder')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Breeder cannot be more than 100 characters'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes cannot be more than 1000 characters'),
    body('fatherName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Father name cannot be more than 100 characters'),
    body('motherName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Mother name cannot be more than 100 characters')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { 
            name, ringNumber, dateOfBirth, color, sex, strain, breeder, notes, 
            achievements, raceResults, vaccinations, fatherName, motherName 
        } = req.body;

        // Process uploaded images
        const images = {};
        const galleryImages = [];
        
        if (req.files) {
            if (req.files.pigeonImage) {
                images.pigeonImage = `/uploads/${req.files.pigeonImage[0].filename}`;
            }
            if (req.files.fatherImage) {
                images.fatherImage = `/uploads/${req.files.fatherImage[0].filename}`;
            }
            if (req.files.motherImage) {
                images.motherImage = `/uploads/${req.files.motherImage[0].filename}`;
            }
            if (req.files.galleryImages) {
                req.files.galleryImages.forEach(file => {
                    galleryImages.push(`/uploads/${file.filename}`);
                });
            }
        }

        // Process pedigree data
        const pedigree = {};
        const pedigreeFieldMapping = {
            'gggFather': 'greatGreatGrandfather',
            'gggMother': 'greatGreatGrandmother',
            'ggFather': 'greatGrandfather',
            'ggMother': 'greatGrandmother',
            'gFather': 'grandfather',
            'gMother': 'grandmother'
        };
        
        Object.keys(pedigreeFieldMapping).forEach(frontendField => {
            const backendField = pedigreeFieldMapping[frontendField];
            const nameKey = `${frontendField}Name`;
            const imageKey = `${frontendField}Image`;
            
            if (req.body[nameKey] || (req.files && req.files[imageKey])) {
                pedigree[backendField] = {
                    name: req.body[nameKey] || '',
                    image: req.files && req.files[imageKey] ? `/uploads/${req.files[imageKey][0].filename}` : ''
                };
            }
        });

        // Parse JSON fields
        let parsedAchievements = [];
        let parsedRaceResults = [];
        let parsedVaccinations = [];
        
        if (achievements) {
            try {
                parsedAchievements = JSON.parse(achievements);
            } catch (e) {
                parsedAchievements = achievements.split(',').map(a => a.trim()).filter(a => a);
            }
        }
        
        if (raceResults) {
            try {
                parsedRaceResults = JSON.parse(raceResults);
            } catch (e) {
                parsedRaceResults = [];
            }
        }
        
        if (vaccinations) {
            try {
                parsedVaccinations = JSON.parse(vaccinations);
            } catch (e) {
                parsedVaccinations = [];
            }
        }

        // Create new pigeon
        const pigeon = new Pigeon({
            name,
            ringNumber: ringNumber || '',
            dateOfBirth: dateOfBirth || null,
            color: color || '',
            sex: sex || 'Unknown',
            strain: strain || '',
            breeder: breeder || '',
            notes: notes || '',
            achievements: parsedAchievements,
            raceResults: parsedRaceResults,
            vaccinations: parsedVaccinations,
            images: galleryImages,
            fatherName: fatherName || '',
            motherName: motherName || '',
            pigeonImage: images.pigeonImage || '',
            fatherImage: images.fatherImage || '',
            motherImage: images.motherImage || '',
            pedigree,
            user: req.user._id
        });

        await pigeon.save();

        res.status(201).json(pigeon);
    } catch (error) {
        console.error('Create pigeon error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/pigeons/:id
// @desc    Update a pigeon with images
// @access  Private
router.put('/:id', uploadPigeonImages, [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),
    body('ringNumber')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Ring number cannot be more than 50 characters'),
    body('color')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Color cannot be more than 50 characters'),
    body('sex')
        .optional()
        .isIn(['Male', 'Female', 'Unknown'])
        .withMessage('Sex must be Male, Female, or Unknown'),
    body('strain')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Strain cannot be more than 100 characters'),
    body('breeder')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Breeder cannot be more than 100 characters'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes cannot be more than 1000 characters'),
    body('fatherName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Father name cannot be more than 100 characters'),
    body('motherName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Mother name cannot be more than 100 characters')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { 
            name, ringNumber, dateOfBirth, color, sex, strain, breeder, notes, 
            achievements, raceResults, vaccinations, fatherName, motherName 
        } = req.body;

        // Get existing pigeon to preserve existing images
        const existingPigeon = await Pigeon.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!existingPigeon) {
            return res.status(404).json({ message: 'Pigeon not found' });
        }

        // Process uploaded images
        const images = {
            pigeonImage: existingPigeon.pigeonImage,
            fatherImage: existingPigeon.fatherImage,
            motherImage: existingPigeon.motherImage
        };
        
        let galleryImages = [...(existingPigeon.images || [])];

        if (req.files) {
            if (req.files.pigeonImage) {
                images.pigeonImage = `/uploads/${req.files.pigeonImage[0].filename}`;
            }
            if (req.files.fatherImage) {
                images.fatherImage = `/uploads/${req.files.fatherImage[0].filename}`;
            }
            if (req.files.motherImage) {
                images.motherImage = `/uploads/${req.files.motherImage[0].filename}`;
            }
            if (req.files.galleryImages) {
                req.files.galleryImages.forEach(file => {
                    galleryImages.push(`/uploads/${file.filename}`);
                });
            }
        }

        // Process pedigree data
        const pedigree = { ...existingPigeon.pedigree };
        const pedigreeFieldMapping = {
            'gggFather': 'greatGreatGrandfather',
            'gggMother': 'greatGreatGrandmother',
            'ggFather': 'greatGrandfather',
            'ggMother': 'greatGrandmother',
            'gFather': 'grandfather',
            'gMother': 'grandmother'
        };
        
        Object.keys(pedigreeFieldMapping).forEach(frontendField => {
            const backendField = pedigreeFieldMapping[frontendField];
            const nameKey = `${frontendField}Name`;
            const imageKey = `${frontendField}Image`;
            
            if (req.body[nameKey] || (req.files && req.files[imageKey])) {
                pedigree[backendField] = {
                    name: req.body[nameKey] || (pedigree[backendField] ? pedigree[backendField].name : ''),
                    image: req.files && req.files[imageKey] ? `/uploads/${req.files[imageKey][0].filename}` : (pedigree[backendField] ? pedigree[backendField].image : '')
                };
            }
        });

        // Parse JSON fields
        let parsedAchievements = existingPigeon.achievements || [];
        let parsedRaceResults = existingPigeon.raceResults || [];
        let parsedVaccinations = existingPigeon.vaccinations || [];
        
        if (achievements) {
            try {
                parsedAchievements = JSON.parse(achievements);
            } catch (e) {
                parsedAchievements = achievements.split(',').map(a => a.trim()).filter(a => a);
            }
        }
        
        if (raceResults) {
            try {
                parsedRaceResults = JSON.parse(raceResults);
            } catch (e) {
                // Keep existing race results if parsing fails
            }
        }
        
        if (vaccinations) {
            try {
                parsedVaccinations = JSON.parse(vaccinations);
            } catch (e) {
                // Keep existing vaccinations if parsing fails
            }
        }

        // Find and update pigeon
        const pigeon = await Pigeon.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id
            },
            {
                name,
                ringNumber: ringNumber || '',
                dateOfBirth: dateOfBirth || null,
                color: color || '',
                sex: sex || 'Unknown',
                strain: strain || '',
                breeder: breeder || '',
                notes: notes || '',
                achievements: parsedAchievements,
                raceResults: parsedRaceResults,
                vaccinations: parsedVaccinations,
                images: galleryImages,
                fatherName: fatherName || '',
                motherName: motherName || '',
                pigeonImage: images.pigeonImage,
                fatherImage: images.fatherImage,
                motherImage: images.motherImage,
                pedigree
            },
            { new: true, runValidators: true }
        );

        res.json(pigeon);
    } catch (error) {
        console.error('Update pigeon error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Pigeon not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/pigeons/:id
// @desc    Delete a pigeon
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const pigeon = await Pigeon.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!pigeon) {
            return res.status(404).json({ message: 'Pigeon not found' });
        }

        res.json({ message: 'Pigeon deleted successfully' });
    } catch (error) {
        console.error('Delete pigeon error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Pigeon not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 