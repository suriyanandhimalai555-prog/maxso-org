const db = require('../db');

// DEPOSIT
const createDeposit = async (req, res, next) => {
    const { userCode, amount, senderCode } = req.body;
    try {
        if (!userCode || !amount || amount <= 0) {
            throw new Error('Valid User Code and positive amount are required');
        }

        // Start a transaction block
        await db.query('BEGIN');

        // Find user by userCode
        const userRes = await db.query('SELECT id FROM "User" WHERE referral_code = $1', [userCode]);
        if (userRes.rows.length === 0) throw new Error('User not found');
        const userId = userRes.rows[0].id;

        // Update user balance
        await db.query('UPDATE "User" SET wallet_balance = wallet_balance + $1 WHERE id = $2', [amount, userId]);

        let shouldProcessCommissions = true;
        if (req.user.role === 'admin' && !senderCode) {
            shouldProcessCommissions = false;
        }

        let depositRefUser = null;
        if (shouldProcessCommissions && senderCode) {
            const senderRes = await db.query('SELECT id FROM "User" WHERE referral_code = $1', [senderCode]);
            if (senderRes.rows.length > 0) {
                depositRefUser = senderRes.rows[0].id;
            }
        }

        // Create transaction record
        const result = await db.query(
            'INSERT INTO "Transaction" (user_id, type, amount, status, reference_user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, 'Deposit', amount, 'completed', depositRefUser]
        );

        // --- LEVEL COMMISSION DISTRIBUTION ---
        // Only run level commissions for non-admins, OR for admins who explicitly provide a senderCode
        if (shouldProcessCommissions) {
            // 1. Fetch the user's upline referrers and their active LevelConfig rules
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

            // 2. Distribute commissions
            for (const comm of commRes.rows) {
                const commAmount = Math.round(((parseFloat(amount) * parseFloat(comm.percentage)) / 100) * 10000) / 10000;

                if (commAmount > 0) {
                    // Level 1 (Direct) and beyond all go to level_wallet_balance for consistency
                    const incomeType = parseInt(comm.level) === 1 ? 'direct_income' : 'level_income';
                    const walletColumn = 'level_wallet_balance';

                    // Update the referrer's specific wallet (all levels go to level_wallet_balance)
                    await db.query(`UPDATE "User" SET ${walletColumn} = ${walletColumn} + $1 WHERE id = $2`, [commAmount, comm.referrer_id]);

                    // Create income transaction log for the referrer
                    await db.query(
                        'INSERT INTO "Transaction" (user_id, type, amount, status, reference_user_id) VALUES ($1, $2, $3, $4, $5)',
                        [comm.referrer_id, incomeType, commAmount, 'completed', userId]
                    );
                }
            }
        }
        // --- END LEVEL COMMISSION ---

        await db.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(400);
        next(error);
    }
};

// WITHDRAW
const createWithdraw = async (req, res, next) => {
    const { userCode, amount } = req.body;
    try {
        if (!userCode || !amount || amount <= 0) {
            throw new Error('Valid User Code and positive amount are required');
        }

        await db.query('BEGIN');

        // Check combined income balance
        const userRes = await db.query('SELECT id, wallet_balance, roi_wallet_balance, level_wallet_balance, direct_wallet_balance FROM "User" WHERE referral_code = $1 FOR UPDATE', [userCode]);
        if (userRes.rows.length === 0) throw new Error('User not found');
        const userId = userRes.rows[0].id;

        // Total available income balance
        const totalIncomeBalance = parseFloat(userRes.rows[0].roi_wallet_balance) 
                                 + parseFloat(userRes.rows[0].level_wallet_balance) 
                                 + parseFloat(userRes.rows[0].direct_wallet_balance);

        if (totalIncomeBalance < parseFloat(amount)) {
            throw new Error('Insufficient income balance for withdrawal');
        }

        // Deduct withdrawal sequentially from ROI -> Level -> Direct to prevent negative wallets
        let withdrawAmount = parseFloat(amount);
        let roi = parseFloat(userRes.rows[0].roi_wallet_balance);
        let level = parseFloat(userRes.rows[0].level_wallet_balance);
        let direct = parseFloat(userRes.rows[0].direct_wallet_balance);
        
        if (roi >= withdrawAmount) { roi -= withdrawAmount; withdrawAmount = 0; }
        else { withdrawAmount -= roi; roi = 0; }
        
        if (withdrawAmount > 0) {
            if (level >= withdrawAmount) { level -= withdrawAmount; withdrawAmount = 0; }
            else { withdrawAmount -= level; level = 0; }
        }
        
        if (withdrawAmount > 0) {
            if (direct >= withdrawAmount) { direct -= withdrawAmount; withdrawAmount = 0; }
            else { withdrawAmount -= direct; direct = 0; }
        }

        // Technically, due to line 109 `totalIncomeBalance < amount` above, we will never overdraw.
        await db.query(
            'UPDATE "User" SET roi_wallet_balance = $1, level_wallet_balance = $2, direct_wallet_balance = $3 WHERE id = $4', 
            [roi, level, direct, userId]
        );

        // Create transaction record
        const result = await db.query(
            'INSERT INTO "Transaction" (user_id, type, amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, 'Withdraw Approved', amount, 'completed']
        );

        await db.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(400);
        next(error);
    }
};

// TRANSFER
const createTransfer = async (req, res, next) => {
    const { senderCode, receiverCode, amount } = req.body;
    try {
        if (!senderCode || !receiverCode || !amount || amount <= 0) {
            throw new Error('Valid sender, receiver, and positive amount are required');
        }

        if (senderCode === receiverCode) {
            throw new Error('Sender and receiver cannot be the same');
        }

        await db.query('BEGIN');

        // Check balance (locking the row)
        const senderRes = await db.query('SELECT id, wallet_balance FROM "User" WHERE referral_code = $1 FOR UPDATE', [senderCode]);
        if (senderRes.rows.length === 0) throw new Error('Sender not found');
        const senderId = senderRes.rows[0].id;

        if (parseFloat(senderRes.rows[0].wallet_balance) < parseFloat(amount)) {
            throw new Error('Insufficient balance for transfer');
        }

        // Lock receiver row
        const receiverRes = await db.query('SELECT id FROM "User" WHERE referral_code = $1 FOR UPDATE', [receiverCode]);
        if (receiverRes.rows.length === 0) throw new Error('Receiver not found');
        const receiverId = receiverRes.rows[0].id;

        // Deduct sender
        await db.query('UPDATE "User" SET wallet_balance = wallet_balance - $1 WHERE id = $2', [amount, senderId]);

        // Add to receiver
        await db.query('UPDATE "User" SET wallet_balance = wallet_balance + $1 WHERE id = $2', [amount, receiverId]);

        // Create transaction record for sender (outward transfer)
        const result = await db.query(
            'INSERT INTO "Transaction" (user_id, type, amount, status, reference_user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [senderId, 'transfer', amount, 'completed', receiverId]
        );

        await db.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(400);
        next(error);
    }
};

// GET TRANSACTION HISTORY (ADMIN)
const getAdminTransactions = async (req, res, next) => {
    try {
        const { type } = req.query; // optional filter 'deposit', 'withdraw', 'transfer'

        // We join the user table to get user details to display on frontend
        let query = `
      SELECT 
        t.id, t.type, t.amount, t.status, t.created_at,
        t.user_id, t.reference_user_id, t.transaction_hash, t.description,
        u.referral_code AS "from_user", u.name AS "user_name",
        r.referral_code AS "to_user"
      FROM "Transaction" t
      LEFT JOIN "User" u ON t.user_id = u.id
      LEFT JOIN "User" r ON t.reference_user_id = r.id
    `;
        const params = [];

        if (type) {
            query += ` WHERE t.type = $1`;
            params.push(type);
        }

        query += ` ORDER BY t.created_at DESC`;

        const result = await db.query(query, params);
        
        const withCount = result.rows.filter(r => (r.type||'').toLowerCase().includes('withdraw')).length;
        console.log(`[API] /admin/history returning ${result.rows.length} total rows. Withdrawals: ${withCount}`);
        
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500);
        next(error);
    }
};

// GET TRANSACTION HISTORY (USER)
const getMyTransactions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Fetch transactions where the user is either the primary user or the reference user (receiver of a transfer)
        let query = `
      SELECT 
        t.id, t.type, t.amount, t.status, t.created_at, t.user_id, t.reference_user_id,
        t.transaction_hash, t.description,
        u.referral_code AS "from_user", u.name AS "user_name",
        r.referral_code AS "to_user"
      FROM "Transaction" t
      LEFT JOIN "User" u ON t.user_id = u.id
      LEFT JOIN "User" r ON t.reference_user_id = r.id
      WHERE t.user_id = $1 OR (t.reference_user_id = $1 AND t.type = 'transfer')
      ORDER BY t.created_at DESC
    `;

        const result = await db.query(query, [userId]);

        const withCount = result.rows.filter(r => (r.type || '').toLowerCase().includes('withdraw')).length;
        console.log(`[API] /history for user ${userId} returning ${result.rows.length} total rows. Withdrawals: ${withCount}`);

        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500);
        next(error);
    }
};

module.exports = {
    createDeposit,
    createWithdraw,
    createTransfer,
    getAdminTransactions,
    getMyTransactions
};
