const https = require('https');

function testLogin(email, password) {
  const data = JSON.stringify({
    email: email,
    password: password
  });

  const options = {
    hostname: 'pegions.vercel.app',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const parsed = JSON.parse(responseData);
        console.log('Response:', parsed);
      } catch (e) {
        console.log('Raw response:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(data);
  req.end();
}

// Test with sample credentials
console.log('Testing login with sample credentials...');
testLogin('test@example.com', 'password123');

// You can also test with your actual credentials
// testLogin('your-email@example.com', 'your-password'); 