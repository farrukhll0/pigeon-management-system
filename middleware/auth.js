const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        // Verify token and decode user ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // For serverless functions, we'll just pass the decoded token
        // The actual user lookup can be done in the route handler if needed
        req.user = {
            userId: decoded.userId,
            ...decoded
        };
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Optional: Middleware to get full user data if needed
const authWithUser = async (req, res, next) => {
    try {
        const User = require('../models/User');
        const connectDB = require('../lib/db');
        
        // Ensure database connection
        await connectDB();
        
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }
        console.error('Auth with user middleware error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = {
    auth,
    authWithUser
}; 