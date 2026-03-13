const cron = require('node-cron');
const db = require('../db');

const round4 = (n) => Math.round(n * 10000) / 10000;

const processMonthlyLevelIncome = async () => {
    console.log('[Monthly Level Job] Starting execution...');
    try {
        await db.query('BEGIN');

        // Fetch all active UserPlans that are exactly on a 30-day boundary
        const plansQuery = `
            SELECT 
                up.id as user_plan_id, up.user_id, up.amount, up.start_date,
                p.roi
            FROM "UserPlan" up
            JOIN "Plan" p ON up.plan_id = p.id
            WHERE up.status = 'active' AND p.status = 'active'
            AND DATE_PART('day', NOW() - up.start_date)::integer > 0
            AND DATE_PART('day', NOW() - up.start_date)::integer % 30 = 0
            FOR UPDATE OF up
        `;
        const eligiblePlans = await db.query(plansQuery);
        let processedCount = 0;

        for (let plan of eligiblePlans.rows) {
            const monthlyRoiThisCycle = parseFloat(plan.amount) * (parseFloat(plan.roi) / 100);

            // Get investor's referral code
            const userRes = await db.query('SELECT referral_code FROM "User" WHERE id = $1', [plan.user_id]);
            if (userRes.rows.length === 0 || !userRes.rows[0].referral_code) continue;
            const investorCode = userRes.rows[0].referral_code;

            // Fetch eligible uplines from Referral table linked with LevelConfig
            const uplinesQuery = `
                SELECT 
                    r.referrer_code, r.level, c.percentage, u.id as upline_id
                FROM "Referral" r
                JOIN "LevelConfig" c ON r.level = c.level
                JOIN "User" u ON r.referrer_code = u.referral_code
                WHERE r.referred_code = $1 AND c.status = 'active'
                ORDER BY r.level ASC
            `;
            const uplinesRes = await db.query(uplinesQuery, [investorCode]);

            for (let upline of uplinesRes.rows) {
                // The upline must have at least one active UserPlan
                const uplinePlanQuery = `
                    SELECT up.id as user_plan_id, up.amount, p.ceiling_limit
                    FROM "UserPlan" up
                    JOIN "Plan" p ON up.plan_id = p.id
                    WHERE up.user_id = $1 AND up.status = 'active' AND p.status = 'active'
                    ORDER BY up.start_date ASC
                `;
                const uplinePlansRes = await db.query(uplinePlanQuery, [upline.upline_id]);

                if (uplinePlansRes.rows.length === 0) continue;

                // Calculate level income (rounding to 4 decimal places)
                const levelIncome = round4(monthlyRoiThisCycle * (parseFloat(upline.percentage) / 100));
                let remainingIncomeToDistribute = levelIncome;

                for (let tPlan of uplinePlansRes.rows) {
                    if (remainingIncomeToDistribute <= 0) break;

                    let limitMultiplier = parseFloat(tPlan.ceiling_limit);
                    if (isNaN(limitMultiplier)) limitMultiplier = 1;
                    const maxEarnings = parseFloat(tPlan.amount) * limitMultiplier;

                    // Compute total earned on this upline plan
                    const descMatch = `UserPlan ID: ${tPlan.user_plan_id} |%`;
                    const earnedRes = await db.query(`
                        SELECT COALESCE(SUM(amount), 0) as total FROM "Transaction" 
                        WHERE user_id = $1 AND (type ILIKE '%roi income%' OR type ILIKE '%level%income%' OR type = 'roi_income' OR type = 'level_income') AND description LIKE $2
                    `, [upline.upline_id, descMatch]);

                    const totalEarned = parseFloat(earnedRes.rows[0].total);
                    const remainingCap = maxEarnings - totalEarned;

                    if (remainingCap <= 0) {
                        await db.query('UPDATE "UserPlan" SET status = $1 WHERE id = $2', ['completed', tPlan.user_plan_id]);
                        continue;
                    }

                    const creditAmount = round4(Math.min(remainingIncomeToDistribute, remainingCap));

                    // Credit Upline's Level wallet
                    await db.query('UPDATE "User" SET level_wallet_balance = level_wallet_balance + $1 WHERE id = $2', [creditAmount, upline.upline_id]);

                    // Log Transfer
                    const desc = `UserPlan ID: ${tPlan.user_plan_id} | Src Plan: ${plan.user_plan_id} | Level ${upline.level}`;
                    const levelTypeString = `Level ${upline.level} Income`;
                    await db.query(
                        'INSERT INTO "Transaction" (user_id, type, amount, status, reference_user_id, description) VALUES ($1, $2, $3, $4, $5, $6)',
                        [upline.upline_id, levelTypeString, creditAmount, 'completed', plan.user_id, desc]
                    );

                    remainingIncomeToDistribute -= creditAmount;

                    if (remainingCap - creditAmount <= 0.0001) {
                        await db.query('UPDATE "UserPlan" SET status = $1 WHERE id = $2', ['completed', tPlan.user_plan_id]);
                    }
                }
            }
            processedCount++;
        }

        await db.query('COMMIT');
        console.log(`[Monthly Level Job] Successfully processed ${processedCount} UserPlans.`);
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('[Monthly Level Job] Error:', error);
    }
};

module.exports = {
    processMonthlyLevelIncome,
    start: () => {
        // Run every day at 11:55 PM IST (18:25 UTC), after Daily ROI
        cron.schedule('55 18 * * *', processMonthlyLevelIncome);
        console.log('Monthly Level Cron Job initialized.');
    }
};
