const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const connectDB = require('../../lib/db');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  console.log('=== SIGNUP REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }
  
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully');
    
    const { name, email, password } = req.body;
    console.log('Extracted data:', { 
      name: name ? 'provided' : 'missing', 
      email: email ? 'provided' : 'missing', 
      password: password ? 'provided' : 'missing' 
    });
    
    if (!name || !email || !password) {
      console.log('Validation failed: missing required fields');
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    console.log('Checking if user exists...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }
    
    console.log('Creating new user...');
    const user = new User({ name, email, password });
    console.log('User object created, saving...');
    await user.save();
    console.log('User saved successfully:', user.email);
    
    console.log('Creating JWT token...');
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('JWT token created successfully');
    
    console.log('Sending success response');
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('=== SIGNUP ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    if (error.code === 11000) {
      console.error('Duplicate key error');
      return res.status(400).json({ message: 'User already exists' });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 