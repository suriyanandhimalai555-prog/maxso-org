const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Direct connection to the production database
const pool = new Pool({
    connectionString: 'postgresql://postgres.zgvsqpwvcfqkhjpqpiwv:Maxso-Clone@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
});

async function updateAdminCredentials() {
    const newEmail = 'Admin@amacso.org';
    const newPassword = 'Amacso#1@23#1';

    try {
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // First, check current admin
        const currentAdmin = await pool.query(
            `SELECT id, email, role FROM "User" WHERE email = $1`,
            ['admin@maxso.com']
        );

        if (currentAdmin.rows.length === 0) {
            console.log('❌ Admin user with email admin@maxso.com not found!');
            process.exit(1);
        }

        console.log('✅ Found admin user:', currentAdmin.rows[0]);

        // Update email and password
        const result = await pool.query(
            `UPDATE "User" SET email = $1, password = $2 WHERE email = $3 RETURNING id, email, role`,
            [newEmail, hashedPassword, 'admin@maxso.com']
        );

        console.log('✅ Admin credentials updated successfully!');
        console.log('   New email:', result.rows[0].email);
        console.log('   ID:', result.rows[0].id);
        console.log('   Role:', result.rows[0].role);

    } catch (err) {
        console.error('❌ Error updating admin credentials:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

updateAdminCredentials();
