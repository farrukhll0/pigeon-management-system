const mongoose = require('mongoose');

// Cache the connection to avoid creating new connections on each function call
let cachedConnection = null;

const connectDB = async () => {
  // Validate MongoDB URI
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // If we already have a connection and it's ready, return it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    // Check if we're already connected
    if (mongoose.connection.readyState === 1) {
      cachedConnection = mongoose.connection;
      return cachedConnection;
    }

    // For Vercel serverless, we need to handle connection differently
    if (process.env.VERCEL) {
      // In serverless environment, create a new connection each time
      // but with optimized settings for serverless
      const connection = await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 1, // Limit pool size for serverless
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000, // Reduced timeout for faster response
        bufferCommands: true, // Enable buffering for serverless
        autoIndex: false // Disable auto-indexing for faster startup
      });
      
      console.log('MongoDB connected successfully (serverless)');
      return connection;
    } else {
      // For traditional server environment
      const connection = await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });
      
      console.log('MongoDB connected successfully');
      cachedConnection = connection;
      return connection;
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('MongoDB URI:', process.env.MONGODB_URI ? 'Set (hidden for security)' : 'NOT SET');
    throw error;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
  cachedConnection = null; // Reset cache on error
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  cachedConnection = null;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

module.exports = connectDB; 