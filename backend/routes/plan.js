const express = require('express');

const {
    getAllPlans,
    createPlan,
    updatePlan,
    deletePlan,
    buyPlan,
    getMyPlans
} = require('../controllers/planController');

const { requireAuth, requireAdmin } = require('../middleware/requireAuth');

const router = express.Router();

// Public routes (or can be made private if needed later)
router.get('/', getAllPlans);

// User routes (must be before /:id to avoid path conflicts)
router.get('/my-plans', requireAuth, getMyPlans);
router.post('/:id/buy', requireAuth, buyPlan);

// Protected Admin routes for Plan management
router.post('/', requireAuth, requireAdmin, createPlan);
router.put('/:id', requireAuth, requireAdmin, updatePlan);
router.delete('/:id', requireAuth, requireAdmin, deletePlan);

module.exports = router;

