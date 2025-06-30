module.exports = (req, res) => {
  console.log('=== DEBUG ENDPOINT CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  
  res.status(200).json({
    message: 'Debug endpoint working!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL ? 'Yes' : 'No'
    }
  });
}; 