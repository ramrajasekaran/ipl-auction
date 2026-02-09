
const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'sriramsriram16145@gmail.com';
const TEST_PASSWORD = 'password123'; // Assuming this is correct from common context

async function runVerification() {
    try {
        console.log('--- SESSION VALIDATION TEST ---');

        // 1. LOGIN
        console.log(`[1] Logging in as ${TEST_EMAIL}...`);
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })
        });

        const loginData = await loginRes.json();
        if (!loginData.success) {
            throw new Error(`Login failed: ${loginData.message}`);
        }

        const token = loginData.token;
        const setCookie = loginRes.headers.get('set-cookie');

        console.log('✅ Login Successful. Token obtained.');

        // 2. VERIFY JWT + SESSION WORKS
        console.log('[2] Testing /auth/me with valid JWT and Session...');
        const meRes = await fetch(`${BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': setCookie || ''
            }
        });
        const meData = await meRes.json();
        if (meData.success) {
            console.log('✅ Access Granted:', meData.user.name);
        } else {
            console.log('❌ Access Denied:', meData.message);
        }

        // 3. LOGOUT
        console.log('[3] Logging out...');
        const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cookie': setCookie || ''
            }
        });
        const logoutData = await logoutRes.json();
        console.log('✅ Logout Result:', logoutData.message);

        // 4. VERIFY ACCESS DENIED EVEN WITH OLD JWT
        console.log('[4] Testing /auth/me with old JWT (Session is gone)...');
        const finalRes = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const finalData = await finalRes.json();

        if (finalRes.status === 401) {
            console.log('✅ SUCCESS: Access denied as expected. Message:', finalData.message);
        } else if (finalRes.status === 200) {
            console.log('❌ FAIL: Access was still granted even after logout!');
        } else {
            console.log('❓ Unexpected status:', finalRes.status, finalData.message);
        }

    } catch (error) {
        console.error('❌ Test failed unexpectedly:', error.message);
        console.log('\nTIP: Ensure the backend is running at http://localhost:5000');
    }
}

runVerification();
