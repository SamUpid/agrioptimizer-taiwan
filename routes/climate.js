/**
 * Climate Routes
 */

const express = require('express');
const router = express.Router();
const climateController = require('../controllers/climateController');

// GET /climate - Show climate dashboard
router.get('/', climateController.showClimatePage);

// GET /climate/data - API endpoint
router.get('/data', climateController.getClimateData);

module.exports = router;