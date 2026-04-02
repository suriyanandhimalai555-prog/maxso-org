const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const validator = require('validator');
const crypto = require('crypto');

const createToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET, { expiresIn: '3d' });
};

// Generates a code like "MAX8F3A2B1C"
const generateReferralCode = () => 'MAX' + crypto.randomBytes(4).toString('hex').toUpperCase();

const signupUser = async (req, res, next) => {
  const { name, email, password } = req.body;
  let { referred_by_code } = req.body;

  const client = await db.pool.connect();

  try {
    if (!email || !password || !name) throw Error('All fields must be filled');
    if (!validator.isEmail(email)) throw Error('Email not valid');
    if (!validator.isStrongPassword(password)) throw Error('Password not strong enough');

    await client.query('BEGIN');

    const userCheck = await client.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) throw Error('Email already in use');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const referral_code = generateReferralCode();
    let referred_by_id = null;

    if (referred_by_code) {
      referred_by_code = referred_by_code.trim().toUpperCase();
      const referrerRes = await client.query('SELECT id, referral_code FROM "User" WHERE UPPER(TRIM(referral_code)) = $1', [referred_by_code]);

      if (referrerRes.rows.length === 0) {
        throw Error('Invalid referral code');
      }

      referred_by_id = referrerRes.rows[0].id;
      const actualReferrerCode = referrerRes.rows[0].referral_code;

      // 1. Insert the new user first
      const result = await client.query(
        'INSERT INTO "User" (name, email, password, referral_code, referred_by, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, role',
        [name, email, hash, referral_code, referred_by_id, 'user', false]
      );
      const user = result.rows[0];

      // 2. Traverse up and create referral records
      let currentLevel = 1;
      let currentReferrerCode = actualReferrerCode;

      const maxLevelRes = await client.query('SELECT MAX(level) as max_level FROM "LevelConfig" WHERE status = $1', ['active']);
      const maxLevels = parseInt(maxLevelRes.rows[0].max_level) || 0;

      while (currentReferrerCode && currentLevel <= maxLevels) {
        if (currentLevel === 1) {
          await client.query('UPDATE "User" SET referral_count = referral_count + 1 WHERE referral_code = $1', [currentReferrerCode]);
        }

        await client.query(
          'INSERT INTO "Referral" (referrer_code, referred_code, level) VALUES ($1, $2, $3)',
          [currentReferrerCode, referral_code, currentLevel]
        );

        const parentRes = await client.query(
          'SELECT u2.referral_code FROM "User" u1 JOIN "User" u2 ON u1.referred_by = u2.id WHERE UPPER(TRIM(u1.referral_code)) = $1',
          [currentReferrerCode]
        );

        if (parentRes.rows.length > 0 && parentRes.rows[0].referral_code) {
          currentReferrerCode = parentRes.rows[0].referral_code;
          currentLevel++;
        } else {
          break;
        }
      }

      await client.query('COMMIT');
      const token = createToken(user.id);
      res.status(200).json({
        token, email, name, role: user.role, referral_code,
        phone_number: null, wallet_address: null, wallet_balance: 0,
        country: null, created_at: new Date().toISOString(), referral_count: 0
      });

    } else {
      // No referral code provided, just create the user
      const result = await client.query(
        'INSERT INTO "User" (name, email, password, referral_code, referred_by, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, role',
        [name, email, hash, referral_code, null, 'user', false]
      );
      const user = result.rows[0];
      await client.query('COMMIT');

      const token = createToken(user.id);
      res.status(200).json({
        token, email, name, role: user.role, referral_code,
        phone_number: null, wallet_address: null, wallet_balance: 0,
        country: null, created_at: new Date().toISOString(), referral_count: 0
      });
    }
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    res.status(400);
    next(error);
  } finally {
    client.release();
  }
};

const loginUser = async (req, res, next) => {
  // 'email' from req.body can act as either email or phone number
  const { email, password } = req.body;
  try {
    if (!email || !password) throw Error('All fields must be filled');

    const result = await db.query(
      'SELECT * FROM "User" WHERE email = $1 OR phone_number = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw Error('Invalid credentials');
    }

    const token = createToken(user.id);
    console.log(`[DEBUG] Login success for user: ${user.email}, balance: ${user.wallet_balance}`);
    res.status(200).json({
      token,
      email: user.email,
      name: user.name,
      role: user.role,
      referral_code: user.referral_code,
      phone_number: user.phone_number,
      wallet_address: user.wallet_address,
      wallet_balance: user.wallet_balance,
      country: user.country,
      created_at: user.created_at,
      referral_count: user.referral_count
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

// Endpoint to fetch user data if cookie is valid on refresh
const getMe = async (req, res, next) => {
  try {
    const result = await db.query('SELECT email, name, role, referral_code, phone_number, wallet_address, wallet_balance, country, created_at, referral_count FROM "User" WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) throw new Error('User not found');

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(401);
    next(error);
  }
};

// Logout — token is managed client-side, so just acknowledge
const logoutUser = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Base query components
    let baseQuery = 'FROM "User"';
    let countQuery = `SELECT COUNT(*) ${baseQuery}`;
    let dataQuery = `SELECT id, name, email, role, phone_number, wallet_address, wallet_balance, COALESCE(status, true) as status, created_at, referral_code, referral_count ${baseQuery}`;

    const queryParams = [];

    // Append search logic if provided
    if (search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      const searchCondition = ` WHERE name ILIKE $1 OR email ILIKE $1 OR phone_number ILIKE $1 OR referral_code ILIKE $1`;

      countQuery += searchCondition;
      dataQuery += searchCondition;
      queryParams.push(searchPattern);
    }

    // Fetch total count for pagination metadata
    const countResult = await db.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Append Order, Limit, & Offset for the actual data
    dataQuery += ` ORDER BY id ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limitNum, offset);

    // Fetch the paginated rows
    const result = await db.query(dataQuery, queryParams);

    res.status(200).json({
      users: result.rows,
      total: totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

const getReferralHistory = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        r.id AS "S.No", 
        r.referrer_code, 
        u1.name AS "referrer_name",
        r.referred_code, 
        u2.name AS "referred_name",
        r.level, 
        r.created_at 
      FROM "Referral" r
      LEFT JOIN "User" u1 ON r.referrer_code = u1.referral_code
      LEFT JOIN "User" u2 ON r.referred_code = u2.referral_code
      ORDER BY r.id ASC
    `;
    const result = await db.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// --- ADMIN ACTIONS ---

const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  const client = await db.pool.connect();
  try {
    // Basic protection to prevent admin from deleting themselves
    if (req.user.id === parseInt(id, 10)) {
      throw new Error("You cannot delete your own admin account.");
    }

    await client.query('BEGIN');

    // 1. Get referral code to clean up Referral table
    const userRes = await client.query('SELECT referral_code FROM "User" WHERE id = $1', [id]);
    if (userRes.rows.length > 0) {
      const referralCode = userRes.rows[0].referral_code;
      if (referralCode) {
        await client.query('DELETE FROM "Referral" WHERE referrer_code = $1 OR referred_code = $1', [referralCode]);
      }
    }

    // 2. Delete related data from other tables to avoid FK violations and orphans
    await client.query('DELETE FROM "Transaction" WHERE user_id = $1 OR reference_user_id = $1', [id]);
    await client.query('DELETE FROM "UserPlan" WHERE user_id = $1', [id]);

    // 3. Delete the user
    const deleteRes = await client.query('DELETE FROM "User" WHERE id = $1', [id]);
    if (deleteRes.rowCount === 0) throw new Error('User not found');

    await client.query('COMMIT');
    res.status(200).json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    res.status(400);
    next(error);
  } finally {
    client.release();
  }
};

const loginAsUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
    const user = result.rows[0];

    if (!user) throw new Error('User not found');

    // Create a new token for the target user to simulate their session
    const token = createToken(user.id);

    res.status(200).json({
      token,
      email: user.email,
      name: user.name,
      role: user.role,
      referral_code: user.referral_code,
      phone_number: user.phone_number,
      wallet_address: user.wallet_address,
      wallet_balance: user.wallet_balance,
      country: user.country,
      created_at: user.created_at,
      referral_count: user.referral_count,
      message: 'Impersonation active'
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const fields = ['name', 'phone_number', 'email', 'role', 'wallet_address', 'status'];
  const updateData = {};

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  try {
    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    const setParams = [];
    const queryParams = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      setParams.push(`${key} = $${paramIndex}`);
      queryParams.push(value);
      paramIndex++;
    }
    queryParams.push(id);

    const query = `UPDATE "User" SET ${setParams.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, phone_number, role, wallet_address, status, referral_code, created_at, referral_count`;
    const result = await db.query(query, queryParams);

    if (result.rows.length === 0) throw new Error('User not found or update failed');

    res.status(200).json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  const { name, phone_number, email, country, wallet_address } = req.body;
  try {
    if (!email || !name) throw Error('Name and email must be filled');
    if (!validator.isEmail(email)) throw Error('Email not valid');

    const result = await db.query(
      'UPDATE "User" SET name = $1, phone_number = $2, email = $3, country = $4, wallet_address = $5 WHERE id = $6 RETURNING email, name, role, referral_code, phone_number, wallet_address, country, created_at, referral_count',
      [name, phone_number, email, country, wallet_address, req.user.id]
    );

    if (result.rows.length === 0) throw new Error('User not found or update failed');

    res.status(200).json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  try {
    if (!oldPassword || !newPassword) throw Error('All fields must be filled');
    if (!validator.isStrongPassword(newPassword)) throw Error('New password not strong enough');

    const result = await db.query('SELECT password FROM "User" WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) throw new Error('User not found');
    const user = result.rows[0];

    if (!(await bcrypt.compare(oldPassword, user.password))) {
      throw Error('Invalid old password');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE "User" SET password = $1 WHERE id = $2', [hash, req.user.id]);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

// @desc    Get current user's referral list (paginated)
// @route   GET /api/user/my-referrals
const getMyReferrals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Get the user's referral code
    const userRes = await db.query('SELECT referral_code FROM "User" WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const myCode = userRes.rows[0].referral_code;

    let baseCondition = 'WHERE r.referrer_code = $1';
    const queryParams = [myCode];
    let paramIdx = 2;

    // Search filter
    if (search.trim()) {
      baseCondition += ` AND (u.name ILIKE $${paramIdx} OR r.referred_code ILIKE $${paramIdx})`;
      queryParams.push(`%${search.trim()}%`);
      paramIdx++;
    }

    // Date range filter
    if (startDate) {
      baseCondition += ` AND r.created_at >= $${paramIdx}`;
      queryParams.push(startDate);
      paramIdx++;
    }
    if (endDate) {
      baseCondition += ` AND r.created_at <= $${paramIdx}`;
      queryParams.push(endDate);
      paramIdx++;
    }

    // Count
    const countQuery = `SELECT COUNT(*) FROM "Referral" r LEFT JOIN "User" u ON r.referred_code = u.referral_code ${baseCondition}`;
    const countRes = await db.query(countQuery, queryParams);
    const total = parseInt(countRes.rows[0].count, 10);

    // Data
    const dataQuery = `
      SELECT 
        r.id,
        u.name as username,
        r.referred_code as referral_code,
        r.level,
        r.created_at
      FROM "Referral" r
      LEFT JOIN "User" u ON r.referred_code = u.referral_code
      ${baseCondition}
      ORDER BY r.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    queryParams.push(limitNum, offset);

    const result = await db.query(dataQuery, queryParams);

    res.status(200).json({
      referrals: result.rows,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Get current user's referral network tree
// @route   GET /api/user/my-network
const getMyNetwork = async (req, res, next) => {
  try {
    const userRes = await db.query('SELECT referral_code, name, status FROM "User" WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const myCode = userRes.rows[0].referral_code;
    const myName = userRes.rows[0].name;
    const myStatus = userRes.rows[0].status;

    // Fetch ONLY explicit direct (Level 1) links across the entire database to build a strict tree.
    const allLinksRes = await db.query(`
      SELECT r.referrer_code, r.referred_code, r.created_at, u.name as referred_name, u.status as referred_status
      FROM "Referral" r
      JOIN "User" u ON r.referred_code = u.referral_code
      WHERE r.level = 1
      ORDER BY r.created_at ASC
    `);

    // Build a map of parentCode -> array of children
    const childrenMap = {};
    for (const row of allLinksRes.rows) {
      if (!childrenMap[row.referrer_code]) {
        childrenMap[row.referrer_code] = [];
      }
      childrenMap[row.referrer_code].push({
        name: row.referred_name,
        referralCode: row.referred_code,
        status: row.referred_status
      });
    }

    // Recursive pure function to build exactly the downline starting from any node (no depth limit)
    const buildTreeMem = (referralCode, userName, status) => {
      const node = {
        name: userName,
        referralCode: referralCode,
        status: status,
        children: []
      };

      const directChildren = childrenMap[referralCode] || [];
      for (const child of directChildren) {
        node.children.push(buildTreeMem(child.referralCode, child.name, child.status));
      }

      return node;
    };

    const tree = buildTreeMem(myCode, myName, myStatus);

    res.status(200).json(tree);
  } catch (error) {
    res.status(500);
    next(error);
  }
};

// @desc    Get detailed level-wise breakdown for Level 1 to 8
// @route   GET /api/user/level-earnings
const getLevelEarnings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRes = await db.query('SELECT referral_code FROM "User" WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const myCode = userRes.rows[0].referral_code;

    // 1. Fetch all users and their total active/completed deposits (from March onwards)
    const userDepositsRes = await db.query(`
      SELECT u.id, u.referral_code, u.name, COALESCE(SUM(up.amount), 0) as total_deposit
      FROM "User" u
      LEFT JOIN "UserPlan" up ON u.id = up.user_id 
        AND up.status IN ('active', 'completed')
        AND up.end_date >= DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY u.id, u.referral_code, u.name
    `);
    const usersMap = {}; // referral_code -> { id, name, deposit }
    const idToCode = {}; // id -> referral_code
    userDepositsRes.rows.forEach(row => {
      usersMap[row.referral_code] = {
        id: row.id,
        name: row.name,
        deposit: parseFloat(row.total_deposit)
      };
      idToCode[row.id] = row.referral_code;
    });

    // 2. Fetch all direct referral links (Level 1)
    const linksRes = await db.query('SELECT referrer_code, referred_code FROM "Referral" WHERE level = 1');
    const childrenMap = {}; // referrer_code -> [referred_codes]
    linksRes.rows.forEach(row => {
      if (!childrenMap[row.referrer_code]) childrenMap[row.referrer_code] = [];
      childrenMap[row.referrer_code].push(row.referred_code);
    });

    // 3. Fetch actual Level Income transactions for this user since that month
    const userTransactionsRes = await db.query(`
      SELECT reference_user_id, SUM(amount) as total_earned
      FROM "Transaction"
      WHERE user_id = $1
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
        AND (type ILIKE 'Level % Income' OR type = 'direct_income' OR type = 'level_income')
        AND status = 'completed'
      GROUP BY reference_user_id
    `, [userId]);
    const userEarningsMap = {};
    userTransactionsRes.rows.forEach(row => {
      userEarningsMap[row.reference_user_id] = parseFloat(row.total_earned);
    });

    // 4. Fetch LevelConfig to calculate expected monthly earnings based on current deposit percentage
    const levelConfigRes = await db.query('SELECT level, percentage FROM "LevelConfig" WHERE status = $1', ['active']);
    const levelPercentages = {};
    levelConfigRes.rows.forEach(row => {
      levelPercentages[row.level] = parseFloat(row.percentage);
    });

    // 4. Helper to calculate total business recursively (cached)
    // IMPORTANT: "Total Business" for each person is THEIR OWN deposit + THEIR DOWNLINE.
    const businessCache = {};
    const calculateBusiness = (refCode, visited = new Set()) => {
      if (visited.has(refCode)) return 0; // Prevent circularity
      if (businessCache[refCode] !== undefined) return businessCache[refCode];

      visited.add(refCode);
      const user = usersMap[refCode];
      let business = user ? user.deposit : 0;

      const children = childrenMap[refCode] || [];
      for (const childCode of children) {
        business += calculateBusiness(childCode, visited);
      }

      businessCache[refCode] = Math.round(business * 100) / 100;
      return business;
    };

    // 5. Build the breakdown based on active LevelConfig levels
    const maxLevel = Object.keys(levelPercentages).length > 0
      ? Math.max(...Object.keys(levelPercentages).map(Number))
      : 0;

    const breakdown = {};
    for (let i = 1; i <= maxLevel; i++) {
      breakdown[i] = {
        members: [],
        subtotals: { deposit: 0, business: 0, earnings: 0 }
      };
    }

    const traverse = (refCode, currentLevel) => {
      if (currentLevel > maxLevel) return;

      const children = childrenMap[refCode] || [];
      for (const childCode of children) {
        const userData = usersMap[childCode];
        if (userData) {
          const business = calculateBusiness(childCode);
          const actualEarning = userEarningsMap[userData.id] || 0;

          const member = {
            name: userData.name,
            referralCode: childCode,
            deposit: Math.round(userData.deposit * 100) / 100,
            business: Math.round(business * 100) / 100,
            earnings: Math.round(actualEarning * 100) / 100
          };

          breakdown[currentLevel].members.push(member);
          breakdown[currentLevel].subtotals.deposit = Math.round((breakdown[currentLevel].subtotals.deposit + member.deposit) * 100) / 100;
          breakdown[currentLevel].subtotals.business = Math.round((breakdown[currentLevel].subtotals.business + member.business) * 100) / 100;
          breakdown[currentLevel].subtotals.earnings = Math.round((breakdown[currentLevel].subtotals.earnings + member.earnings) * 100) / 100;

          // Continue to next level
          traverse(childCode, currentLevel + 1);
        }
      }
    };

    traverse(myCode, 1);

    res.status(200).json(breakdown);
  } catch (error) {
    res.status(500);
    next(error);
  }
};

module.exports = { signupUser, loginUser, getMe, logoutUser, getAllUsers, getReferralHistory, deleteUser, loginAsUser, updateUser, updateProfile, changePassword, getMyReferrals, getMyNetwork, getLevelEarnings };
