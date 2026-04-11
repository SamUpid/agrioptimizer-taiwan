const express = require('express');
const router = express.Router();
const cropsController = require('../controllers/cropsController');

// GET /crops - Show recommendations
router.get('/', cropsController.showCropsPage);

// GET /crops/:id - Show crop detail
router.get('/:id', cropsController.showCropDetail);

module.exports = router;