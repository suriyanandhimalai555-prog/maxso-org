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
            todayEarnings: { dailyRoi: 0, levelIncome: 0 },
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
                WHERE (type ILIKE '%level%income%' OR type ILIKE '%level_income%' OR type ILIKE '%roi income%' OR type = 'roi_income' OR type ILIKE '%direct%income%' OR type ILIKE '%referral%bonus%') AND status = 'completed'
                GROUP BY type
            `);
            walletRes.rows.forEach(row => {
                const t = row.type.toLowerCase();
                // Level 1 Income from monthly job is categorized as directIncome to be consistent with direct_income
                if (t === 'level 1 income' || (t.includes('direct') && t.includes('income')) || t.includes('referral bonus')) {
                    stats.wallet.directIncome += parseFloat(row.total);
                } else if (t.includes('level') && t.includes('income') && t !== 'level_income_bonus') {
                    stats.wallet.levelIncome += parseFloat(row.total);
                } else if (t.includes('roi income') || t === 'roi_income') {
                    stats.wallet.roiIncome += parseFloat(row.total);
                }
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
            stats.referrals.earnings = stats.wallet.directIncome + stats.wallet.levelIncome;

            // 5. Deposits Tracking
            const depRes = await db.query(`
                SELECT COUNT(*) as count, SUM(amount) as total_amount
                FROM "Transaction"
                WHERE (type ILIKE '%deposit%' OR type ILIKE '%wallet created%') AND status = 'completed'
            `);
            stats.deposits.count = parseInt(depRes.rows[0].count) || 0;
            stats.deposits.totalAmount = parseFloat(depRes.rows[0].total_amount) || 0;

            // 6. Withdraws Tracking
            const withRes = await db.query(`
                SELECT 
                    SUM(amount) as total_amount,
                    COUNT(*) as count
                FROM "Transaction"
                WHERE type ILIKE '%withdraw%' AND status IN ('completed', 'approved')
            `);
            stats.withdraws.totalAmount = parseFloat(withRes.rows[0].total_amount) || 0;
            stats.withdraws.count = parseInt(withRes.rows[0].count) || 0;

            // 7. Today's Earnings (platform-wide)
            const todayRes = await db.query(`
                SELECT type, SUM(amount) as total
                FROM "Transaction"
                WHERE (type ILIKE '%roi income%' OR type = 'roi_income' 
                   OR type ILIKE '%level%income%' OR type ILIKE '%level_income%'
                   OR type ILIKE '%direct%income%' OR type ILIKE '%referral%bonus%')
                  AND status = 'completed'
                  AND created_at >= NOW() - INTERVAL '24 hours'
                GROUP BY type
            `);
            todayRes.rows.forEach(row => {
                const t = row.type.toLowerCase();
                if (t.includes('roi income') || t === 'roi_income') {
                    stats.todayEarnings.dailyRoi += parseFloat(row.total);
                } else if (t.includes('level') && t.includes('income')) {
                    stats.todayEarnings.levelIncome += parseFloat(row.total);
                } else if ((t.includes('direct') && t.includes('income')) || t.includes('referral bonus')) {
                    stats.todayEarnings.levelIncome += parseFloat(row.total);
                }
            });

        } else {
            // Personal Stats for Regular User

            // Get user's referral code
            const myUserRes = await db.query('SELECT referral_code FROM "User" WHERE id = $1', [userId]);
            const myCode = myUserRes.rows[0]?.referral_code;

            // 1. Total Earnings (all-time income per type)
            const earningsRes = await db.query(`
                SELECT type, SUM(amount) as total
                FROM "Transaction"
                WHERE user_id = $1 AND (type ILIKE '%level%income%' OR type ILIKE '%level_income%' OR type ILIKE '%roi income%' OR type = 'roi_income' OR type ILIKE '%direct%income%' OR type ILIKE '%referral%bonus%') AND status = 'completed'
                GROUP BY type
            `, [userId]);
            earningsRes.rows.forEach(row => {
                const t = row.type.toLowerCase();
                // Both direct/referral and standard level income now go to levelIncome for consistency
                if (t === 'level 1 income' || t.includes('direct') || t.includes('referral') || t.includes('level')) {
                    if (!t.includes('roi')) {
                        stats.earnings.levelIncome += parseFloat(row.total);
                    }
                } else if (t.includes('roi income') || t === 'roi_income') {
                    stats.earnings.roiIncome += parseFloat(row.total);
                }
            });

            // 2. Wallet Balance (read directly from DB wallet columns)
            const walletRes = await db.query(
                'SELECT roi_wallet_balance, level_wallet_balance, direct_wallet_balance FROM "User" WHERE id = $1',
                [userId]
            );
            if (walletRes.rows.length > 0) {
                stats.wallet.roiIncome = parseFloat(walletRes.rows[0].roi_wallet_balance) || 0;
                stats.wallet.levelIncome = parseFloat(walletRes.rows[0].level_wallet_balance) || 0;
                stats.wallet.directIncome = parseFloat(walletRes.rows[0].direct_wallet_balance) || 0;
            }

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
                WHERE user_id = $1 AND (type ILIKE '%deposit%' OR type ILIKE '%wallet created%') AND status = 'completed'
            `, [userId]);
            stats.deposits.count = parseInt(myDepRes.rows[0].count) || 0;
            stats.deposits.totalAmount = parseFloat(myDepRes.rows[0].total_amount) || 0;

            // 5. Withdraws
            const myWithRes = await db.query(`
                SELECT 
                    SUM(amount) as total_amount,
                    COUNT(*) as count
                FROM "Transaction"
                WHERE user_id = $1 AND type ILIKE '%withdraw%' AND status IN ('completed', 'approved')
            `, [userId]);
            stats.withdraws.totalAmount = parseFloat(myWithRes.rows[0].total_amount) || 0;
            stats.withdraws.count = parseInt(myWithRes.rows[0].count) || 0;

            // 6. Today's Earnings (user-specific)
            const todayRes = await db.query(`
                SELECT type, SUM(amount) as total
                FROM "Transaction"
                WHERE user_id = $1
                  AND (type ILIKE '%roi income%' OR type = 'roi_income' 
                   OR type ILIKE '%level%income%' OR type ILIKE '%level_income%'
                   OR type ILIKE '%direct%income%' OR type ILIKE '%referral%bonus%')
                  AND status = 'completed'
                  AND created_at >= NOW() - INTERVAL '24 hours'
                GROUP BY type
            `, [userId]);
            todayRes.rows.forEach(row => {
                const t = row.type.toLowerCase();
                if (t.includes('roi income') || t === 'roi_income') {
                    stats.todayEarnings.dailyRoi += parseFloat(row.total);
                } else if (t.includes('level') && t.includes('income')) {
                    stats.todayEarnings.levelIncome += parseFloat(row.total);
                } else if ((t.includes('direct') && t.includes('income')) || t.includes('referral bonus')) {
                    stats.todayEarnings.levelIncome += parseFloat(row.total);
                }
            });
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
