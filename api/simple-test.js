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
  
  try {
    res.status(200).json({
      message: 'Simple test endpoint working!',
      method: req.method,
      url: req.url,
      env: {
        mongodb: process.env.MONGODB_URI ? 'Set' : 'NOT SET',
        jwt: process.env.JWT_SECRET ? 'Set' : 'NOT SET',
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: 'Test endpoint error',
      error: error.message
    });
  }
}; 