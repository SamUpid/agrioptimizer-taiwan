const express = require('express');
const router = express.Router();
const cropsController = require('../controllers/cropsController');

// GET /crops — Show recommendations
router.get('/', cropsController.showCropsPage);

// GET /crops/:id — Show crop detail
router.get('/:id', cropsController.showCropDetail);

// POST /crops/save — Save crop to farm profile (logged-in only)
router.post('/save', cropsController.saveCrop);

// DELETE /crops/remove — Remove crop from farm profile (logged-in only)
router.delete('/remove', cropsController.removeCrop);

module.exports = router;