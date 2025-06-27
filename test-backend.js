const https = require('https');

// Test the health endpoint first
function testHealth() {
    console.log('Testing health endpoint...');
    
    const options = {
        hostname: 'pegions-5v1ck2mzq-farrukhs-projects-63ff85f0.vercel.app',
        port: 443,
        path: '/api/health',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        console.log(`Health Status: ${res.statusCode}`);
        console.log(`Health Headers:`, res.headers);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                console.log('Health Response:', parsed);
            } catch (e) {
                console.log('Health Raw Response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Health test error: ${e.message}`);
    });

    req.end();
}

// Test the login endpoint
function testLogin(email, password) {
    console.log('\nTesting login endpoint...');
    console.log('Email:', email);
    
    const postData = JSON.stringify({
        email: email,
        password: password
    });

    const options = {
        hostname: 'pegions-5v1ck2mzq-farrukhs-projects-63ff85f0.vercel.app',
        port: 443,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = https.request(options, (res) => {
        console.log(`Login Status: ${res.statusCode}`);
        console.log(`Login Headers:`, res.headers);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                console.log('Login Response:', parsed);
            } catch (e) {
                console.log('Login Raw Response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Login test error: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

// Test the signup endpoint
function testSignup(name, email, password) {
    console.log('\nTesting signup endpoint...');
    console.log('Email:', email);
    
    const postData = JSON.stringify({
        name: name,
        email: email,
        password: password
    });

    const options = {
        hostname: 'pegions-5v1ck2mzq-farrukhs-projects-63ff85f0.vercel.app',
        port: 443,
        path: '/api/auth/signup',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = https.request(options, (res) => {
        console.log(`Signup Status: ${res.statusCode}`);
        console.log(`Signup Headers:`, res.headers);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                console.log('Signup Response:', parsed);
            } catch (e) {
                console.log('Signup Raw Response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Signup test error: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

// Run tests
console.log('=== Backend API Test ===');
console.log('URL: https://pegions-5v1ck2mzq-farrukhs-projects-63ff85f0.vercel.app');

// Test health first
testHealth();

// Wait a bit, then test signup
setTimeout(() => {
    testSignup('Test User', 'test@example.com', 'password123');
}, 2000);

// Wait a bit more, then test login
setTimeout(() => {
    testLogin('test@example.com', 'password123');
}, 4000);

// Test with wrong password
setTimeout(() => {
    testLogin('test@example.com', 'wrongpassword');
}, 6000); 