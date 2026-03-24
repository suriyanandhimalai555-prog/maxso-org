const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/requireAuth');
const {
    createDeposit,
    createWithdraw,
    createTransfer,
    getAdminTransactions,
    getMyTransactions,
    requestWithdrawal,
    getPendingWithdrawals,
    approveWithdrawal,
    rejectWithdrawal
} = require('../controllers/transactionController');

const router = express.Router();

// User routes
router.get('/history', requireAuth, getMyTransactions);
router.post('/withdraw-request', requireAuth, requestWithdrawal);

// Admin-only routes
router.post('/deposit', requireAuth, requireAdmin, createDeposit);
router.post('/withdraw', requireAuth, requireAdmin, createWithdraw); // Legacy/Direct bypass
router.post('/transfer', requireAuth, requireAdmin, createTransfer);
router.get('/admin/history', requireAuth, requireAdmin, getAdminTransactions);
router.get('/admin/pending', requireAuth, requireAdmin, getPendingWithdrawals);
router.post('/admin/approve/:id', requireAuth, requireAdmin, approveWithdrawal);
router.post('/admin/reject/:id', requireAuth, requireAdmin, rejectWithdrawal);

module.exports = router;
