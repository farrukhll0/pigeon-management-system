export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  console.log('=== TEST ENDPOINT ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Environment variables check:');
  console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
  console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  
  try {
    res.status(200).json({
      message: 'Test endpoint working',
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
    console.error('Test endpoint error:', error);
    res.status(500).json({
      message: 'Test endpoint error',
      error: error.message
    });
  }
} 