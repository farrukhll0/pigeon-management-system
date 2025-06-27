const fetch = require('node-fetch');

// Replace with your actual Vercel deployment URL
const BASE_URL = 'https://your-app-name.vercel.app'; // Replace with your actual URL

async function testLogin() {
    try {
        console.log('Testing login endpoint...');
        console.log('URL:', `${BASE_URL}/api/auth/login`);
        
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const data = await response.json();
        console.log('Response data:', data);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

async function testHealth() {
    try {
        console.log('Testing health endpoint...');
        console.log('URL:', `${BASE_URL}/api/health`);
        
        const response = await fetch(`${BASE_URL}/api/health`);
        console.log('Health check status:', response.status);
        
        const data = await response.json();
        console.log('Health check data:', data);

    } catch (error) {
        console.error('Health check failed:', error);
    }
}

// Run tests
async function runTests() {
    console.log('=== Testing Health Endpoint ===');
    await testHealth();
    
    console.log('\n=== Testing Login Endpoint ===');
    await testLogin();
}

runTests(); 