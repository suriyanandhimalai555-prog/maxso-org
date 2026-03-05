const axios = require('axios');

const API_URL = 'http://localhost:4000/api/user';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    try {
        console.log('--- Registering User 1 ---');
        const u1 = await axios.post(`${API_URL}/signup`, {
            name: 'User One',
            email: `u1-${Date.now()}@test.com`,
            password: 'Password123!',
            referred_by_code: ''
        });
        console.log('User 1 Code:', u1.data.referral_code);

        await delay(1000);

        console.log('\n--- Registering User 2 (Referred by User 1) ---');
        const u2 = await axios.post(`${API_URL}/signup`, {
            name: 'User Two',
            email: `u2-${Date.now()}@test.com`,
            password: 'Password123!',
            referred_by_code: u1.data.referral_code
        });
        console.log('User 2 Code:', u2.data.referral_code);

        await delay(1000);

        console.log('\n--- Registering User 3 (Referred by User 2) ---');
        const u3 = await axios.post(`${API_URL}/signup`, {
            name: 'User Three',
            email: `u3-${Date.now()}@test.com`,
            password: 'Password123!',
            referred_by_code: u2.data.referral_code
        });
        console.log('User 3 Code:', u3.data.referral_code);

        await delay(1000);

        // To verify the data locally we would ideally call the admin endpoint, but that requires auth
        console.log('\n✅ Signups successful. Verification requires checking the Admin Dashboard table or the DB directly to confirm that User 3 traces back to User 1 as Level 2.');

    } catch (err) {
        console.error('❌ Test failed:', err.response?.data || err.message);
    }
}

runTest();
