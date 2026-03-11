const cron = require('node-cron');
const db = require('../db');

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
            // reset time for pure date comparison if needed, or just standard timestamp logic:
            if (now > endDate) {
                await db.query('UPDATE "UserPlan" SET status = $1 WHERE id = $2', ['completed', plan.user_plan_id]);
                continue;
            }

            // Calculate daily ROI
            const monthlyRoi = parseFloat(plan.amount) * (parseFloat(plan.roi) / 100);
            const dailyRoi = monthlyRoi / 30;

            // Calculate max earnings
            let limitMultiplier = parseFloat(plan.ceiling_limit);
            if (isNaN(limitMultiplier)) limitMultiplier = 1;
            const maxEarnings = parseFloat(plan.amount) * limitMultiplier;

            // Calculate total earned so far (ROI + Level) mapped via description since we can't alter schema
            const descMatch = `UserPlan ID: ${plan.user_plan_id} |%`;
            const earnedQuery = `
                SELECT COALESCE(SUM(amount), 0) as total FROM "Transaction"
                WHERE user_id = $1 AND type IN ('Daily ROI Income', 'Level Income')
                AND description LIKE $2
            `;
            const earnedRes = await db.query(earnedQuery, [plan.user_id, descMatch]);
            const totalEarned = parseFloat(earnedRes.rows[0].total);

            const remainingCap = maxEarnings - totalEarned;

            if (remainingCap <= 0) {
                // Mark plan as capped strictly
                await db.query('UPDATE "UserPlan" SET status = $1 WHERE id = $2', ['completed', plan.user_plan_id]);
                continue;
            }

            const creditAmount = Math.min(dailyRoi, remainingCap);

            // Credit investor
            await db.query('UPDATE "User" SET wallet_balance = wallet_balance + $1 WHERE id = $2', [creditAmount, plan.user_id]);

            // Log transfer
            const description = `UserPlan ID: ${plan.user_plan_id} | Daily ROI`;
            await db.query(
                'INSERT INTO "Transaction" (user_id, type, amount, status, reference_user_id, description) VALUES ($1, $2, $3, $4, $5, $6)',
                [plan.user_id, 'Daily ROI Income', creditAmount, 'completed', adminId, description]
            );

            processedCount++;

            // Unlikely to cap exactly on an ROI stroke but check anyway
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
        // Run every day at 00:00 (midnight server time)
        cron.schedule('0 0 * * *', processDailyROI);
        console.log('Daily ROI Cron Job initialized.');
    }
};
