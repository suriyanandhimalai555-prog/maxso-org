const jwt = require('jsonwebtoken');
const db = require('../db');

const requireAuth = async (req, res, next) => {
  // Read token from Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) return res.status(401).json({ error: 'Authorization token required' });

  try {
    const { id } = jwt.verify(token, process.env.SECRET);

    // Fetch user and attach to request
    const result = await db.query('SELECT id, role FROM "User" WHERE id = $1', [id]);
    if (result.rows.length === 0) throw new Error('User not found');

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Request is not authorized' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admins only.' });
  }
};

module.exports = { requireAuth, requireAdmin };