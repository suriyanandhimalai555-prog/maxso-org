const cron = require('node-cron');
const db = require('../db');

const processMonthlyWalletReset = async () => {
    console.log(`[Monthly Wallet Reset] 1st of month. Starting execution...`);

    try {
        await db.query('BEGIN');

        // Fetch all users who have a balance > 0 in either ROI or Level wallet
        const usersRes = await db.query(
            'SELECT id, name, referral_code, roi_wallet_balance, level_wallet_balance FROM "User" WHERE roi_wallet_balance > 0 OR level_wallet_balance > 0 FOR UPDATE'
        );

        const users = usersRes.rows;
        let totalRoiWithdrawn = 0;
        let totalLevelWithdrawn = 0;
        let userCount = 0;

        const now = new Date();

        for (let user of users) {
            const roiBalance = parseFloat(user.roi_wallet_balance);
            const levelBalance = parseFloat(user.level_wallet_balance);

            let withdrew = false;

            if (roiBalance > 0) {
                await db.query(
                    'INSERT INTO "Transaction" (user_id, type, amount, status, description) VALUES ($1, $2, $3, $4, $5)',
                    [user.id, 'Withdraw Approved', roiBalance, 'completed', `Monthly Auto-Withdrawal (ROI Wallet) - ${now.toISOString().slice(0, 7)}`]
                );
                totalRoiWithdrawn += roiBalance;
                withdrew = true;
            }

            if (levelBalance > 0) {
                await db.query(
                    'INSERT INTO "Transaction" (user_id, type, amount, status, description) VALUES ($1, $2, $3, $4, $5)',
                    [user.id, 'Withdraw Approved', levelBalance, 'completed', `Monthly Auto-Withdrawal (Level Wallet) - ${now.toISOString().slice(0, 7)}`]
                );
                totalLevelWithdrawn += levelBalance;
                withdrew = true;
            }

            if (withdrew) {
                await db.query(
                    'UPDATE "User" SET roi_wallet_balance = 0, level_wallet_balance = 0 WHERE id = $1',
                    [user.id]
                );
                userCount++;
                console.log(`[Monthly Wallet Reset] Cleared user ${user.referral_code}: ROI ₹${roiBalance.toFixed(4)}, Level ₹${levelBalance.toFixed(4)}`);
            }
        }

        await db.query('COMMIT');

        console.log(`[Monthly Wallet Reset] ✅ Complete!`);
        console.log(`  - Users processed: ${userCount}`);
        console.log(`  - Total ROI Withdrawn: ₹${totalRoiWithdrawn.toFixed(4)}`);
        console.log(`  - Total Level Withdrawn: ₹${totalLevelWithdrawn.toFixed(4)}`);

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('[Monthly Wallet Reset] ❌ Error:', error);
    }
};

module.exports = {
    processMonthlyWalletReset,
    start: () => {
        // Run on the 1st of every month at 5:30 AM IST (00:00 UTC)
        cron.schedule('0 0 1 * *', processMonthlyWalletReset);
        console.log('Monthly Wallet Reset Cron Job initialized.');
    }
};

