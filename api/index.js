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
  
  console.log('=== API INDEX ENDPOINT ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  res.status(200).json({
    message: 'API is working',
    endpoints: {
      test: '/api/test',
      signup: '/api/auth/signup',
      login: '/api/auth/login'
    },
    timestamp: new Date().toISOString()
  });
}; 