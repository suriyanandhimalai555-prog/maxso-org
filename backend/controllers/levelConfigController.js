const db = require('../db');

// Map DB snake_case to frontend camelCase
const mapLevelConfigToFrontend = (row) => ({
    id: row.id,
    level: row.level,
    percentage: row.percentage,
    requiredVolume: row.required_volume,
    required_volume: row.required_volume, // keeping this as well since frontend is currently using snake case
    status: row.status,
    createdAt: row.created_at,
    created_at: row.created_at, // keeping this as well since frontend is currently using snake case
});

// @desc    Get all level configs
// @route   GET /api/level-configs
// @access  Public
const getAllLevelConfigs = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM "LevelConfig" ORDER BY level ASC');
        res.status(200).json(result.rows.map(mapLevelConfigToFrontend));
    } catch (error) {
        res.status(500);
        next(error);
    }
};

// @desc    Create a new level config
// @route   POST /api/level-configs
// @access  Private/Admin
const createLevelConfig = async (req, res, next) => {
    const { level, percentage, required_volume, status } = req.body;

    try {
        if (level === undefined || percentage === undefined || required_volume === undefined) {
            throw Error('Level, percentage, and required volume must be provided');
        }

        const result = await db.query(
            `INSERT INTO "LevelConfig" (level, percentage, required_volume, status) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [level, percentage, required_volume, status || 'active']
        );

        res.status(201).json(mapLevelConfigToFrontend(result.rows[0]));
    } catch (error) {
        if (error.code === '23505') { // PostgreSQL unique violation code
            res.status(400);
            return next(new Error('Level already exists'));
        }
        res.status(400);
        next(error);
    }
};

// @desc    Update a level config
// @route   PUT /api/level-configs/:id
// @access  Private/Admin
const updateLevelConfig = async (req, res, next) => {
    const { id } = req.params;
    const { level, percentage, required_volume, status } = req.body;

    try {
        const result = await db.query(
            `UPDATE "LevelConfig" 
       SET level = $1, percentage = $2, required_volume = $3, status = $4
       WHERE id = $5 RETURNING *`,
            [level, percentage, required_volume, status, id]
        );

        if (result.rows.length === 0) {
            throw new Error('Level config not found or update failed');
        }

        res.status(200).json(mapLevelConfigToFrontend(result.rows[0]));
    } catch (error) {
        if (error.code === '23505') { // PostgreSQL unique violation code
            res.status(400);
            return next(new Error('Level number conflicts with another config'));
        }
        res.status(400);
        next(error);
    }
};

// @desc    Delete a level config
// @route   DELETE /api/level-configs/:id
// @access  Private/Admin
const deleteLevelConfig = async (req, res, next) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM "LevelConfig" WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            throw new Error('Level config not found or could not be deleted');
        }

        res.status(200).json({ message: 'Level config deleted successfully', id });
    } catch (error) {
        res.status(400);
        next(error);
    }
};

module.exports = {
    getAllLevelConfigs,
    createLevelConfig,
    updateLevelConfig,
    deleteLevelConfig
};
