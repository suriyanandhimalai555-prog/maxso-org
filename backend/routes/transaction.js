const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/requireAuth');
const {
    createDeposit,
    createWithdraw,
    createTransfer,
    getAdminTransactions,
    getMyTransactions
} = require('../controllers/transactionController');

const router = express.Router();

// User route for personal transaction history
router.get('/history', requireAuth, getMyTransactions);

// Admin-only routes
router.post('/deposit', requireAuth, requireAdmin, createDeposit);
router.post('/withdraw', requireAuth, requireAdmin, createWithdraw);
router.post('/transfer', requireAuth, requireAdmin, createTransfer);
router.get('/admin/history', requireAuth, requireAdmin, getAdminTransactions);

module.exports = router;
