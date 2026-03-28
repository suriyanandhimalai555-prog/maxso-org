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

        // --- AUTOMATIC PLAN PURCHASE (Plan ID 1) ---
        const planRes = await db.query('SELECT * FROM "Plan" WHERE id = 1');
        if (planRes.rows.length === 0) {
            throw new Error('Default Plan (ID 1) not found');
        }
        const plan = planRes.rows[0];

        if (plan.status !== 'active') throw new Error('Default plan is not currently active');

        if (parseFloat(amount) < parseFloat(plan.min_deposit)) {
            throw new Error(`Minimum deposit is $${plan.min_deposit}`);
        }
        if (parseFloat(amount) > parseFloat(plan.max_deposit)) {
            throw new Error(`Maximum deposit is $${plan.max_deposit}`);
        }

        // Deduct from wallet immediately to lock in plan
        await db.query('UPDATE "User" SET wallet_balance = wallet_balance - $1 WHERE id = $2', [amount, userId]);

        const now = new Date();
        let endDate;
        if (plan.duration_unit === 'days') {
            endDate = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);
        } else {
            endDate = new Date(now.getTime() + (plan.duration * 30) * 24 * 60 * 60 * 1000);
        }

        await db.query(
            `INSERT INTO "UserPlan" (user_id, plan_id, amount, deposit_type, status, start_date, end_date)
             VALUES ($1, $2, $3, $4, 'active', NOW(), $5)`,
            [userId, 1, amount, 'trust_wallet', endDate]
        );

        // Log plan purchase
        await db.query(
            'INSERT INTO "Transaction" (user_id, type, amount, status) VALUES ($1, $2, $3, $4)',
            [userId, 'plan_purchase', amount, 'completed']
        );

        // --- IMMEDIATE DIRECT REFERRAL BONUS ---
        // Removed as per user request to be distributed after a month
        // --- END DIRECT BONUS ---

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

// REQUEST WITHDRAWAL (USER)
const requestWithdrawal = async (req, res, next) => {
    const { amount, walletType } = req.body;
    const userId = req.user.id;

    console.log(`[Withdraw Request] User: ${userId}, Amount: ${amount}, Wallet: ${walletType}`);

    try {
        if (!amount || parseFloat(amount) <= 0 || !walletType) {
            console.error(`[Withdraw Request Error] Invalid inputs: amount=${amount}, walletType=${walletType}`);
            throw new Error('Valid amount and wallet type are required');
        }

        const walletColumnMap = {
            'ROI': 'roi_wallet_balance',
            'Level': 'level_wallet_balance',
            'Direct': 'direct_wallet_balance'
        };

        const walletColumn = walletColumnMap[walletType];
        if (!walletColumn) {
            console.error(`[Withdraw Request Error] Invalid walletType: ${walletType}`);
            throw new Error('Invalid wallet type');
        }

        await db.query('BEGIN');

        // Check balance
        const userRes = await db.query(`SELECT ${walletColumn} FROM "User" WHERE id = $1 FOR UPDATE`, [userId]);
        if (userRes.rows.length === 0) {
            console.error(`[Withdraw Request Error] User ${userId} not found`);
            throw new Error('User not found');
        }
        
        const balance = parseFloat(userRes.rows[0][walletColumn]);

        if (balance < parseFloat(amount)) {
            console.error(`[Withdraw Request Error] Insufficient balance: ${balance} < ${amount}`);
            throw new Error(`Insufficient balance in ${walletType} wallet`);
        }

        // Deduct/Hold funds
        const numericAmount = parseFloat(amount);
        await db.query(`UPDATE "User" SET ${walletColumn} = ${walletColumn} - $1 WHERE id = $2`, [numericAmount, userId]);

        // Create pending transaction
        const result = await db.query(
            'INSERT INTO "Transaction" (user_id, type, amount, status, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, `W/D (${walletType})`, numericAmount, 'pending', `Withdrawal from ${walletType} wallet`]
        );

        console.log(`[Withdraw Request Success] ID: ${result.rows[0].id}`);
        await db.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await db.query('ROLLBACK');
        console.error(`[Withdraw Request Exception] Message: ${error.message}, Stack: ${error.stack}`);
        res.status(400).json({ message: error.message });
    }
};

// GET PENDING WITHDRAWALS (ADMIN)
const getPendingWithdrawals = async (req, res, next) => {
    try {
        const query = `
            SELECT t.*, u.referral_code, u.name as user_name, u.email
            FROM "Transaction" t
            JOIN "User" u ON t.user_id = u.id
            WHERE t.status = 'pending' AND (t.type ILIKE 'Withdraw Request%' OR t.type ILIKE 'W/D%')
            ORDER BY t.created_at DESC
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500);
        next(error);
    }
};

// APPROVE WITHDRAWAL (ADMIN)
const approveWithdrawal = async (req, res, next) => {
    const { id } = req.params;
    const { transactionHash } = req.body;

    try {
        await db.query('BEGIN');

        const transRes = await db.query('SELECT * FROM "Transaction" WHERE id = $1 AND status = $2 FOR UPDATE', [id, 'pending']);
        if (transRes.rows.length === 0) throw new Error('Pending transaction not found');

        const trans = transRes.rows[0];

        // Update status to completed
        await db.query(
            'UPDATE "Transaction" SET status = $1, type = $2, transaction_hash = $3 WHERE id = $4',
            ['completed', 'Withdraw Approved', transactionHash || trans.transaction_hash, id]
        );

        await db.query('COMMIT');
        res.status(200).json({ message: 'Withdrawal approved successfully' });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(400);
        next(error);
    }
};

// REJECT WITHDRAWAL (ADMIN)
const rejectWithdrawal = async (req, res, next) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        await db.query('BEGIN');

        const transRes = await db.query('SELECT * FROM "Transaction" WHERE id = $1 AND status = $2 FOR UPDATE', [id, 'pending']);
        if (transRes.rows.length === 0) throw new Error('Pending transaction not found');

        const trans = transRes.rows[0];
        
        // Identify wallet type from transaction type or description
        let walletColumn = null;
        if (trans.type.includes('(ROI)')) walletColumn = 'roi_wallet_balance';
        else if (trans.type.includes('(Level)')) walletColumn = 'level_wallet_balance';
        else if (trans.type.includes('(Direct)')) walletColumn = 'direct_wallet_balance';

        if (!walletColumn) throw new Error('Could not identify wallet to refund');

        // Refund funds
        await db.query(`UPDATE "User" SET ${walletColumn} = ${walletColumn} + $1 WHERE id = $2`, [trans.amount, trans.user_id]);

        // Update status to rejected
        await db.query(
            'UPDATE "Transaction" SET status = $1, description = $2 WHERE id = $3',
            ['rejected', `Rejected: ${reason || 'No reason provided'}`, id]
        );

        await db.query('COMMIT');
        res.status(200).json({ message: 'Withdrawal rejected and funds refunded' });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(400);
        next(error);
    }
};

// REQUEST DEPOSIT (USER)
const requestDeposit = async (req, res, next) => {
    const { amount, transactionHash } = req.body;
    const userId = req.user.id;

    try {
        if (!amount || amount <= 0) throw new Error('Positive amount is required');

        await db.query('BEGIN');

        // Create pending transaction
        const result = await db.query(
            'INSERT INTO "Transaction" (user_id, type, amount, status, transaction_hash, reference_user_id, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [userId, 'Deposit Request', amount, 'pending', transactionHash, 59, 'User deposit request']
        );

        await db.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(400).json({ message: error.message });
    }
};

// APPROVE DEPOSIT (ADMIN)
const approveDeposit = async (req, res, next) => {
    const { id } = req.params;

    try {
        await db.query('BEGIN');

        // 1. Find the pending deposit
        const transRes = await db.query('SELECT * FROM "Transaction" WHERE id = $1 AND status = $2 FOR UPDATE', [id, 'pending']);
        if (transRes.rows.length === 0) throw new Error('Pending deposit not found / already processed');
        const trans = transRes.rows[0];

        if (!trans.type.includes('Deposit')) throw new Error('Transaction is not a deposit');

        const userId = trans.user_id;
        const amount = trans.amount;

        // 2. Update user balance
        await db.query('UPDATE "User" SET wallet_balance = wallet_balance + $1 WHERE id = $2', [amount, userId]);

        // 3. Mark transaction as completed
        await db.query(
            'UPDATE "Transaction" SET status = $1, type = $2 WHERE id = $3',
            ['completed', 'Deposit', id]
        );

        // 4. --- AUTOMATIC PLAN PURCHASE (Plan ID 1) ---
        const planRes = await db.query('SELECT * FROM "Plan" WHERE id = 1');
        if (planRes.rows.length === 0) {
            throw new Error('Default Plan (ID 1) not found');
        }
        const plan = planRes.rows[0];

        if (plan.status !== 'active') throw new Error('Default plan is not currently active');

        if (parseFloat(amount) < parseFloat(plan.min_deposit)) {
            throw new Error(`Minimum deposit is $${plan.min_deposit}`);
        }
        if (parseFloat(amount) > parseFloat(plan.max_deposit)) {
            throw new Error(`Maximum deposit is $${plan.max_deposit}`);
        }

        // Deduct from wallet immediately to lock in plan
        await db.query('UPDATE "User" SET wallet_balance = wallet_balance - $1 WHERE id = $2', [amount, userId]);

        const now = new Date();
        let endDate;
        if (plan.duration_unit === 'days') {
            endDate = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);
        } else {
            endDate = new Date(now.getTime() + (plan.duration * 30) * 24 * 60 * 60 * 1000);
        }

        await db.query(
            `INSERT INTO "UserPlan" (user_id, plan_id, amount, deposit_type, status, start_date, end_date)
             VALUES ($1, $2, $3, $4, 'active', NOW(), $5)`,
            [userId, 1, amount, 'trust_wallet', endDate]
        );

        // Log plan purchase
        await db.query(
            'INSERT INTO "Transaction" (user_id, type, amount, status) VALUES ($1, $2, $3, $4)',
            [userId, 'plan_purchase', amount, 'completed']
        );

        // --- IMMEDIATE DIRECT REFERRAL BONUS ---
        // Removed as per user request to be distributed after a month
        // --- END DIRECT BONUS ---

        await db.query('COMMIT');
        res.status(200).json({ message: 'Deposit approved and credited' });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(400).json({ message: error.message });
    }
};

// REJECT DEPOSIT (ADMIN)
const rejectDeposit = async (req, res, next) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        await db.query('BEGIN');

        const transRes = await db.query('SELECT * FROM "Transaction" WHERE id = $1 AND status = $2 FOR UPDATE', [id, 'pending']);
        if (transRes.rows.length === 0) throw new Error('Pending deposit not found / already processed');

        await db.query(
            'UPDATE "Transaction" SET status = $1, description = $2 WHERE id = $3',
            ['rejected', `Rejected: ${reason || 'No reason provided'}`, id]
        );

        await db.query('COMMIT');
        res.status(200).json({ message: 'Deposit rejected' });
    } catch (error) {
        await db.query('ROLLBACK');
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createDeposit,
    createWithdraw,
    createTransfer,
    getAdminTransactions,
    getMyTransactions,
    requestWithdrawal,
    getPendingWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
    requestDeposit,
    approveDeposit,
    rejectDeposit
};
