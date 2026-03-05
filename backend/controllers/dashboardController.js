const db = require('../db');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const role = req.user.role; // 'admin' or 'user'

        const stats = {
            users: { total: 0, active: 0, inactive: 0 },
            wallet: { levelIncome: 0, roiIncome: 0, directIncome: 0 },
            earnings: { roiIncome: 0, levelIncome: 0, referralIncome: 0 },
            referrals: { total: 0, level1: 0, earnings: 0 },
            deposits: { totalAmount: 0, count: 0 },
            withdraws: { totalAmount: 0, count: 0 }
        };

        if (role === 'admin') {
            // Global Stats for Admin

            // 1. User Stats
            const usersRes = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = true THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = false THEN 1 ELSE 0 END) as inactive
                FROM "User"
            `);
            const uData = usersRes.rows[0];
            stats.users.total = parseInt(uData.total) || 0;
            stats.users.active = parseInt(uData.active) || 0;
            stats.users.inactive = parseInt(uData.inactive) || 0;

            // 2. Wallet Balance (total income earned on the platform)
            const walletRes = await db.query(`
                SELECT type, SUM(amount) as total
                FROM "Transaction"
                WHERE type IN ('level_income', 'roi_income', 'direct_income') AND status = 'completed'
                GROUP BY type
            `);
            walletRes.rows.forEach(row => {
                if (row.type === 'level_income') stats.wallet.levelIncome = parseFloat(row.total);
                if (row.type === 'roi_income') stats.wallet.roiIncome = parseFloat(row.total);
                if (row.type === 'direct_income') stats.wallet.directIncome = parseFloat(row.total);
            });

            // 3. Earnings (same as wallet for admin - platform-wide totals)
            stats.earnings.roiIncome = stats.wallet.roiIncome;
            stats.earnings.levelIncome = stats.wallet.levelIncome;
            stats.earnings.referralIncome = stats.wallet.directIncome;

            // 4. Referral Tracking globally
            const refRes = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN level = 1 THEN 1 ELSE 0 END) as level1
                FROM "Referral"
            `);
            const rData = refRes.rows[0];
            stats.referrals.total = parseInt(rData.total) || 0;
            stats.referrals.level1 = parseInt(rData.level1) || 0;
            stats.referrals.earnings = stats.wallet.directIncome;

            // 5. Deposits Tracking
            const depRes = await db.query(`
                SELECT COUNT(*) as count, SUM(amount) as total_amount
                FROM "Transaction"
                WHERE type = 'deposit' AND status = 'completed'
            `);
            stats.deposits.count = parseInt(depRes.rows[0].count) || 0;
            stats.deposits.totalAmount = parseFloat(depRes.rows[0].total_amount) || 0;

            // 6. Withdraws Tracking
            const withRes = await db.query(`
                SELECT 
                    SUM(amount) as total_amount,
                    COUNT(*) as count
                FROM "Transaction"
                WHERE type = 'withdraw' AND status = 'completed'
            `);
            stats.withdraws.totalAmount = parseFloat(withRes.rows[0].total_amount) || 0;
            stats.withdraws.count = parseInt(withRes.rows[0].count) || 0;

        } else {
            // Personal Stats for Regular User

            // Get user's referral code
            const myUserRes = await db.query('SELECT referral_code FROM "User" WHERE id = $1', [userId]);
            const myCode = myUserRes.rows[0]?.referral_code;

            // 1. Total Earnings (all-time income per type)
            const earningsRes = await db.query(`
                SELECT type, SUM(amount) as total
                FROM "Transaction"
                WHERE user_id = $1 AND type IN ('level_income', 'roi_income', 'direct_income') AND status = 'completed'
                GROUP BY type
            `, [userId]);
            earningsRes.rows.forEach(row => {
                if (row.type === 'roi_income') stats.earnings.roiIncome = parseFloat(row.total);
                if (row.type === 'level_income') stats.earnings.levelIncome = parseFloat(row.total);
                if (row.type === 'direct_income') stats.earnings.referralIncome = parseFloat(row.total);
            });

            // 2. Wallet Balance (available income = total income - plan purchases from each wallet type)
            // Start with total earnings per type
            stats.wallet.levelIncome = stats.earnings.levelIncome;
            stats.wallet.roiIncome = stats.earnings.roiIncome;
            stats.wallet.directIncome = stats.earnings.referralIncome;

            // Deduct plan purchases by deposit type
            const planPurchaseRes = await db.query(`
                SELECT deposit_type, SUM(amount) as total
                FROM "UserPlan"
                WHERE user_id = $1
                GROUP BY deposit_type
            `, [userId]);
            planPurchaseRes.rows.forEach(row => {
                if (row.deposit_type === 'level_wallet') {
                    stats.wallet.levelIncome = Math.max(0, stats.wallet.levelIncome - parseFloat(row.total));
                }
                if (row.deposit_type === 'roi_wallet') {
                    stats.wallet.roiIncome = Math.max(0, stats.wallet.roiIncome - parseFloat(row.total));
                }
                if (row.deposit_type === 'trust_wallet') {
                    stats.wallet.directIncome = Math.max(0, stats.wallet.directIncome - parseFloat(row.total));
                }
            });

            // 3. Referrals
            if (myCode) {
                const refRes = await db.query(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN level = 1 THEN 1 ELSE 0 END) as level1
                    FROM "Referral"
                    WHERE referrer_code = $1
                `, [myCode]);
                stats.referrals.total = parseInt(refRes.rows[0].total) || 0;
                stats.referrals.level1 = parseInt(refRes.rows[0].level1) || 0;
                stats.referrals.earnings = stats.earnings.referralIncome + stats.earnings.levelIncome;
            }

            // 4. Deposits
            const myDepRes = await db.query(`
                SELECT COUNT(*) as count, SUM(amount) as total_amount
                FROM "Transaction"
                WHERE user_id = $1 AND type = 'deposit' AND status = 'completed'
            `, [userId]);
            stats.deposits.count = parseInt(myDepRes.rows[0].count) || 0;
            stats.deposits.totalAmount = parseFloat(myDepRes.rows[0].total_amount) || 0;

            // 5. Withdraws
            const myWithRes = await db.query(`
                SELECT 
                    SUM(amount) as total_amount,
                    COUNT(*) as count
                FROM "Transaction"
                WHERE user_id = $1 AND type = 'withdraw' AND status = 'completed'
            `, [userId]);
            stats.withdraws.totalAmount = parseFloat(myWithRes.rows[0].total_amount) || 0;
            stats.withdraws.count = parseInt(myWithRes.rows[0].count) || 0;
        }

        res.status(200).json(stats);
    } catch (error) {
        res.status(500);
        next(error);
    }
};

module.exports = {
    getDashboardStats
};
