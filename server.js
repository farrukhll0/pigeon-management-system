require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Set default values for environment variables
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pigeon-manager';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
process.env.PORT = process.env.PORT || 3000;

const connectDB = require('./lib/db');

// Import routes
const authRoutes = require('./routes/auth');
const pigeonRoutes = require('./routes/pigeons');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pigeons', pigeonRoutes);

// Basic route
app.get('/api/health', (req, res) => {
  const envCheck = {
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'development',
    VERCEL: process.env.VERCEL ? 'Yes' : 'No'
  };
  
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    environment: envCheck,
    timestamp: new Date().toISOString()
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Only start server if not in Vercel serverless environment
if (!process.env.VERCEL) {
  // Start server only after DB connects
  connectDB()
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Visit http://localhost:${PORT} to view the application`);
      });
    })
    .catch((error) => {
      console.error('MongoDB connection failed:', error);
      process.exit(1);
    });
}

module.exports = app; 