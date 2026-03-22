const cron = require('node-cron');
const db = require('../db');

const round4 = (n) => Math.round(n * 10000) / 10000;

const processDailyROI = async () => {
    console.log('[Daily ROI Job] Starting execution...');
    try {
        await db.query('BEGIN');

        // Find admin user for "from_user_id"
        const adminRes = await db.query("SELECT id FROM \"User\" WHERE role = 'admin' ORDER BY id ASC LIMIT 1");
        const adminId = adminRes.rows.length > 0 ? adminRes.rows[0].id : null;

        if (!adminId) {
            console.log('[Daily ROI Job] No admin user found. Skipping.');
            await db.query('ROLLBACK');
            return;
        }

        // Fetch active UserPlans joined with active Plan
        const plansQuery = `
            SELECT 
                up.id as user_plan_id, up.user_id, up.amount, up.end_date,
                p.roi, p.ceiling_limit
            FROM "UserPlan" up
            JOIN "Plan" p ON up.plan_id = p.id
            WHERE up.status = 'active' AND p.status = 'active'
            FOR UPDATE OF up
        `;
        const activePlans = await db.query(plansQuery);

        const now = new Date();
        let processedCount = 0;

        for (let plan of activePlans.rows) {
            // Check expiry
            const endDate = new Date(plan.end_date);
            if (now > endDate) {
                await db.query('UPDATE "UserPlan" SET status = $1 WHERE id = $2', ['completed', plan.user_plan_id]);
                continue;
            }

            // Calculate daily ROI (rounding to 4 decimal places)
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const monthlyRoi = parseFloat(plan.amount) * (parseFloat(plan.roi) / 100);
            const dailyRoi = round4(monthlyRoi / daysInMonth);

            // Calculate max earnings
            let limitMultiplier = parseFloat(plan.ceiling_limit);
            if (isNaN(limitMultiplier)) limitMultiplier = 1;
            const maxEarnings = parseFloat(plan.amount) * limitMultiplier;

            // Calculate total earned so far (ROI + Level) mapped via description
            const descMatch = `UserPlan ID: ${plan.user_plan_id} |%`;
            const earnedQuery = `
                SELECT COALESCE(SUM(amount), 0) as total FROM "Transaction"
                WHERE user_id = $1 AND (
                    type ILIKE '%roi income%' 
                    OR type ILIKE '%level%income%' 
                    OR type ILIKE '%direct%income%'
                    OR type ILIKE '%referral%bonus%'
                    OR type = 'roi_income' 
                    OR type = 'level_income'
                    OR type = 'direct_income'
                )
                AND description LIKE $2
            `;
            const earnedRes = await db.query(earnedQuery, [plan.user_id, descMatch]);
            const totalEarned = parseFloat(earnedRes.rows[0].total);

            const remainingCap = maxEarnings - totalEarned;

            if (remainingCap <= 0) {
                // Mark plan as capped
                await db.query('UPDATE "UserPlan" SET status = $1 WHERE id = $2', ['completed', plan.user_plan_id]);
                continue;
            }

            const creditAmount = round4(Math.min(dailyRoi, remainingCap));

            // Credit investor's ROI wallet
            await db.query('UPDATE "User" SET roi_wallet_balance = roi_wallet_balance + $1 WHERE id = $2', [creditAmount, plan.user_id]);

            // Log transfer
            const description = `UserPlan ID: ${plan.user_plan_id} | Daily ROI`;
            await db.query(
                'INSERT INTO "Transaction" (user_id, type, amount, status, reference_user_id, description) VALUES ($1, $2, $3, $4, $5, $6)',
                [plan.user_id, 'Daily ROI Income', creditAmount, 'completed', adminId, description]
            );

            processedCount++;

            // Check if capped after this credit
            if (remainingCap - creditAmount <= 0.0001) {
                await db.query('UPDATE "UserPlan" SET status = $1 WHERE id = $2', ['completed', plan.user_plan_id]);
            }
        }

        await db.query('COMMIT');
        console.log(`[Daily ROI Job] Successfully processed ${processedCount} plans.`);
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('[Daily ROI Job] Error:', error);
    }
};

// Expose process function for manual triggering and testing
module.exports = {
    processDailyROI,
    start: () => {
        // Run every day at 11:50 PM IST (18:20 UTC)
        cron.schedule('20 18 * * *', processDailyROI);
        console.log('Daily ROI Cron Job initialized.');
    }
};
