const multer = require('multer');

// For Vercel serverless functions, we use memory storage
// Files are stored in memory and can be processed or converted to base64
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure multer for serverless environment with optimized settings
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit (reduced from 10MB)
        files: 5, // Maximum 5 files (reduced from 10)
        fieldSize: 2 * 1024 * 1024 // 2MB field size limit
    }
});

// Single file upload
const uploadSingle = upload.single('image');

// Multiple file upload
const uploadMultiple = upload.array('images', 5);

// Pigeon images upload (multiple fields) - optimized for fewer files
const uploadPigeonImages = upload.fields([
    { name: 'pigeonImage', maxCount: 1 },
    { name: 'fatherImage', maxCount: 1 },
    { name: 'motherImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 3 } // Reduced from 10 to 3
]);

// Profile image upload
const uploadProfileImage = upload.single('profileImage');

// Helper function to convert file buffer to base64
const fileToBase64 = (file) => {
    if (!file) return null;
    return {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        data: file.buffer.toString('base64')
    };
};

// Helper function to process uploaded files
const processUploadedFiles = (files) => {
    if (!files) return {};
    
    const processed = {};
    
    // Handle single file
    if (files.length === 1) {
        processed.file = fileToBase64(files[0]);
        return processed;
    }
    
    // Handle multiple files
    if (Array.isArray(files)) {
        processed.files = files.map(fileToBase64);
        processed.count = files.length;
        return processed;
    }
    
    // Handle fields (multiple named files)
    Object.keys(files).forEach(fieldName => {
        if (Array.isArray(files[fieldName])) {
            processed[fieldName] = files[fieldName].map(fileToBase64);
        } else {
            processed[fieldName] = fileToBase64(files[fieldName]);
        }
    });
    
    return processed;
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                message: 'File too large. Maximum size is 5MB.' 
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                message: 'Too many files. Maximum is 5 files.' 
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                message: 'Unexpected file field.' 
            });
        }
    }
    
    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({ 
            message: 'Only image files are allowed!' 
        });
    }
    
    res.status(500).json({ message: 'File upload failed.' });
};

module.exports = {
    uploadSingle,
    uploadMultiple,
    uploadPigeonImages,
    uploadProfileImage,
    fileToBase64,
    processUploadedFiles,
    handleUploadError
}; 