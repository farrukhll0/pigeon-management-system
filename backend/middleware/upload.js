const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Multiple file upload for pigeon and family images
const uploadPigeonImages = upload.fields([
    { name: 'pigeonImage', maxCount: 1 },
    { name: 'fatherImage', maxCount: 1 },
    { name: 'motherImage', maxCount: 1 },
    { name: 'gggFatherImage', maxCount: 1 },
    { name: 'gggMotherImage', maxCount: 1 },
    { name: 'ggFatherImage', maxCount: 1 },
    { name: 'ggMotherImage', maxCount: 1 },
    { name: 'gFatherImage', maxCount: 1 },
    { name: 'gMotherImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 } // Gallery images (up to 10)
]);

// Single file upload for profile images
const uploadProfileImage = upload.single('profileImage');

module.exports = {
    uploadPigeonImages,
    uploadProfileImage,
    uploadsDir
}; 