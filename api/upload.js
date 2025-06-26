const express = require('express');
const cors = require('cors');
const connectDB = require('../lib/db');
const { auth } = require('../middleware/auth');
const { 
  uploadSingle, 
  uploadMultiple, 
  processUploadedFiles, 
  handleUploadError 
} = require('../middleware/upload');

const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

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

// Upload single image
app.post('/', auth, uploadSingle, async (req, res) => {
  try {
    await ensureDBConnection();
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Process the uploaded file
    const processedFile = processUploadedFiles([req.file]);
    
    res.json({
      success: true,
      file: processedFile.file,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ message: 'Service temporarily unavailable' });
    }
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Upload multiple images
app.post('/multiple', auth, uploadMultiple, async (req, res) => {
  try {
    await ensureDBConnection();
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Process the uploaded files
    const processedFiles = processUploadedFiles(req.files);
    
    res.json({
      success: true,
      ...processedFiles,
      message: `${processedFiles.count} files uploaded successfully`
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    if (error.message === 'Database connection failed') {
      return res.status(503).json({ message: 'Service temporarily unavailable' });
    }
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Error handling middleware
app.use(handleUploadError);

module.exports = app; 