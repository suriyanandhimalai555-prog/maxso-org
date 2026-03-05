const db = require('../db');

// Map DB snake_case to frontend camelCase
const mapPlanToFrontend = (planRow) => ({
    id: planRow.id,
    name: planRow.name,
    roi: planRow.roi,
    duration: planRow.duration,
    durationUnit: planRow.duration_unit,
    referralBonus: planRow.referral_bonus,
    ceilingLimit: planRow.ceiling_limit,
    minDeposit: planRow.min_deposit,
    maxDeposit: planRow.max_deposit,
    status: planRow.status,
    createdAt: planRow.created_at
});

// @desc    Get all plans
// @route   GET /api/plans
// @access  Public
const getAllPlans = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM "Plan" ORDER BY id ASC');
        res.status(200).json(result.rows.map(mapPlanToFrontend));
    } catch (error) {
        res.status(500);
        next(error);
    }
};

// @desc    Create a new plan
// @route   POST /api/plans
// @access  Private/Admin
const createPlan = async (req, res, next) => {
    const {
        name, roi, duration, durationUnit, referralBonus,
        ceilingLimit, minDeposit, maxDeposit, status
    } = req.body;

    try {
        if (!name || roi === undefined || duration === undefined || !durationUnit || referralBonus === undefined || !ceilingLimit || minDeposit === undefined || maxDeposit === undefined) {
            throw Error('All fields must be filled');
        }

        const result = await db.query(
            `INSERT INTO "Plan" 
      (name, roi, duration, duration_unit, referral_bonus, ceiling_limit, min_deposit, max_deposit, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
            [name, roi, duration, durationUnit, referralBonus, ceilingLimit, minDeposit, maxDeposit, status || 'active']
        );

        res.status(201).json(mapPlanToFrontend(result.rows[0]));
    } catch (error) {
        res.status(400);
        next(error);
    }
};

// @desc    Update a plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
const updatePlan = async (req, res, next) => {
    const { id } = req.params;
    const {
        name, roi, duration, durationUnit, referralBonus,
        ceilingLimit, minDeposit, maxDeposit, status
    } = req.body;

    try {
        const result = await db.query(
            `UPDATE "Plan" 
       SET name = $1, roi = $2, duration = $3, duration_unit = $4, referral_bonus = $5, 
           ceiling_limit = $6, min_deposit = $7, max_deposit = $8, status = $9
       WHERE id = $10 
       RETURNING *`,
            [name, roi, duration, durationUnit, referralBonus, ceilingLimit, minDeposit, maxDeposit, status, id]
        );

        if (result.rows.length === 0) {
            throw new Error('Plan not found or update failed');
        }

        res.status(200).json(mapPlanToFrontend(result.rows[0]));
    } catch (error) {
        res.status(400);
        next(error);
    }
};

// @desc    Delete a plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
const deletePlan = async (req, res, next) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM "Plan" WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            throw new Error('Plan not found or could not be deleted');
        }

        res.status(200).json({ message: 'Plan deleted successfully', id });
    } catch (error) {
        res.status(400);
        next(error);
    }
};

// @desc    Buy a plan
// @route   POST /api/plans/:id/buy
// @access  Private (User)
const buyPlan = async (req, res, next) => {
    const { id } = req.params;
    const { amount, depositType } = req.body;
    const userId = req.user.id;

    try {
        if (!amount || amount <= 0) {
            throw new Error('A valid positive amount is required');
        }
        if (!depositType || !['trust_wallet', 'roi_wallet', 'level_wallet'].includes(depositType)) {
            throw new Error('Valid deposit type is required (trust_wallet, roi_wallet, level_wallet)');
        }

        await db.query('BEGIN');

        // 1. Fetch the plan and validate
        const planRes = await db.query('SELECT * FROM "Plan" WHERE id = $1', [id]);
        if (planRes.rows.length === 0) throw new Error('Plan not found');
        const plan = planRes.rows[0];

        if (plan.status !== 'active') throw new Error('This plan is not currently active');

        if (parseFloat(amount) < parseFloat(plan.min_deposit)) {
            throw new Error(`Minimum deposit is $${plan.min_deposit}`);
        }
        if (parseFloat(amount) > parseFloat(plan.max_deposit)) {
            throw new Error(`Maximum deposit is $${plan.max_deposit}`);
        }

        // 2. Check user balance
        const userRes = await db.query('SELECT id, wallet_balance, referral_code FROM "User" WHERE id = $1 FOR UPDATE', [userId]);
        if (userRes.rows.length === 0) throw new Error('User not found');

        if (parseFloat(userRes.rows[0].wallet_balance) < parseFloat(amount)) {
            throw new Error('Insufficient wallet balance');
        }

        const userCode = userRes.rows[0].referral_code;

        // 3. Deduct balance
        await db.query('UPDATE "User" SET wallet_balance = wallet_balance - $1 WHERE id = $2', [amount, userId]);

        // 4. Calculate end date based on plan duration
        let endDate;
        const now = new Date();
        if (plan.duration_unit === 'days') {
            endDate = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);
        } else if (plan.duration_unit === 'months') {
            endDate = new Date(now);
            endDate.setMonth(endDate.getMonth() + plan.duration);
        } else if (plan.duration_unit === 'years') {
            endDate = new Date(now);
            endDate.setFullYear(endDate.getFullYear() + plan.duration);
        } else {
            endDate = new Date(now.getTime() + plan.duration * 30 * 24 * 60 * 60 * 1000);
        }

        // 5. Create UserPlan record
        const userPlanRes = await db.query(
            `INSERT INTO "UserPlan" (user_id, plan_id, amount, deposit_type, status, start_date, end_date)
             VALUES ($1, $2, $3, $4, 'active', NOW(), $5) RETURNING *`,
            [userId, id, amount, depositType, endDate]
        );

        // 6. Create transaction record
        await db.query(
            'INSERT INTO "Transaction" (user_id, type, amount, status) VALUES ($1, $2, $3, $4)',
            [userId, 'plan_purchase', amount, 'completed']
        );

        // 7. Referral commission distribution
        if (userCode) {
            const configQuery = `
                SELECT 
                    r.referrer_code, 
                    r.level, 
                    c.percentage,
                    u.id as referrer_id
                FROM "Referral" r
                JOIN "LevelConfig" c ON r.level = c.level
                JOIN "User" u ON r.referrer_code = u.referral_code
                WHERE r.referred_code = $1 AND c.status = 'active';
            `;
            const commRes = await db.query(configQuery, [userCode]);

            for (const comm of commRes.rows) {
                const commAmount = (parseFloat(amount) * parseFloat(comm.percentage)) / 100;
                if (commAmount > 0) {
                    const incomeType = parseInt(comm.level) === 1 ? 'direct_income' : 'level_income';
                    await db.query('UPDATE "User" SET wallet_balance = wallet_balance + $1 WHERE id = $2', [commAmount, comm.referrer_id]);
                    await db.query(
                        'INSERT INTO "Transaction" (user_id, type, amount, status, reference_user_id) VALUES ($1, $2, $3, $4, $5)',
                        [comm.referrer_id, incomeType, commAmount, 'completed', userId]
                    );
                }
            }
        }

        await db.query('COMMIT');
        res.status(201).json({
            message: 'Plan purchased successfully',
            userPlan: userPlanRes.rows[0]
        });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(400);
        next(error);
    }
};

// @desc    Get my purchased plans (Portfolio)
// @route   GET /api/plans/my-plans
// @access  Private (User)
const getMyPlans = async (req, res, next) => {
    const userId = req.user.id;

    try {
        // Fetch all user plans with plan details
        const result = await db.query(`
            SELECT 
                up.id,
                up.user_id,
                up.plan_id,
                up.amount,
                up.deposit_type,
                up.status,
                up.start_date,
                up.end_date,
                up.created_at,
                p.name as plan_name,
                p.roi,
                p.duration,
                p.duration_unit,
                p.ceiling_limit,
                p.referral_bonus
            FROM "UserPlan" up
            JOIN "Plan" p ON up.plan_id = p.id
            WHERE up.user_id = $1
            ORDER BY up.created_at DESC
        `, [userId]);

        // For each user plan, calculate earnings
        const plansWithEarnings = await Promise.all(result.rows.map(async (plan) => {
            // Get ROI earnings (plan_purchase related ROI distributions for this user)
            const roiRes = await db.query(
                `SELECT COALESCE(SUM(amount), 0) as total FROM "Transaction" 
                 WHERE user_id = $1 AND type = 'roi_income' AND created_at >= $2`,
                [userId, plan.start_date]
            );

            // Get level/direct income earnings
            const levelRes = await db.query(
                `SELECT COALESCE(SUM(amount), 0) as total FROM "Transaction" 
                 WHERE user_id = $1 AND type IN ('level_income', 'direct_income') AND created_at >= $2`,
                [userId, plan.start_date]
            );

            const roiEarnings = parseFloat(roiRes.rows[0].total);
            const levelEarnings = parseFloat(levelRes.rows[0].total);
            const totalEarnings = roiEarnings + levelEarnings;

            // Parse ceiling limit - try to extract multiplier (e.g., "10X" -> 10)
            let ceilingAmount = parseFloat(plan.amount) * 10; // default 10x
            const ceilingMatch = plan.ceiling_limit.match(/(\d+(?:\.\d+)?)\s*[xX]/);
            if (ceilingMatch) {
                ceilingAmount = parseFloat(plan.amount) * parseFloat(ceilingMatch[1]);
            }

            const progress = ceilingAmount > 0 ? ((totalEarnings / ceilingAmount) * 100).toFixed(1) : 0;

            // Calculate remaining days
            const now = new Date();
            const endDate = new Date(plan.end_date);
            const remainingMs = endDate.getTime() - now.getTime();
            const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

            // Determine status
            let displayStatus = 'Plan Ongoing';
            if (plan.status === 'completed' || remainingDays === 0) {
                displayStatus = 'Completed';
            } else if (plan.status === 'cancelled') {
                displayStatus = 'Cancelled';
            }

            return {
                id: plan.id,
                planName: plan.plan_name,
                amount: plan.amount,
                depositType: plan.deposit_type,
                roiEarnings: roiEarnings.toFixed(4),
                levelEarnings: levelEarnings.toFixed(4),
                totalEarnings: totalEarnings.toFixed(4),
                ceilingAmount: ceilingAmount.toFixed(2),
                progress: parseFloat(progress),
                startDate: plan.start_date,
                endDate: plan.end_date,
                remainingDays,
                status: displayStatus,
                roi: plan.roi,
                duration: plan.duration,
                durationUnit: plan.duration_unit
            };
        }));

        res.status(200).json(plansWithEarnings);
    } catch (error) {
        res.status(500);
        next(error);
    }
};

module.exports = {
    getAllPlans,
    createPlan,
    updatePlan,
    deletePlan,
    buyPlan,
    getMyPlans
};
