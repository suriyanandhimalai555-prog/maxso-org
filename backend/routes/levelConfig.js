const express = require('express');

const {
    getAllLevelConfigs,
    createLevelConfig,
    updateLevelConfig,
    deleteLevelConfig
} = require('../controllers/levelConfigController');

const { requireAuth, requireAdmin } = require('../middleware/requireAuth');

const router = express.Router();

router.get('/', requireAuth, getAllLevelConfigs);
router.post('/', requireAuth, requireAdmin, createLevelConfig);
router.put('/:id', requireAuth, requireAdmin, updateLevelConfig);
router.delete('/:id', requireAuth, requireAdmin, deleteLevelConfig);

module.exports = router;
