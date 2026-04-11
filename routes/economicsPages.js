const express = require('express');
const router = express.Router();
const economicsController = require('../controllers/economicsController');

// GET /economics - Show calculator
router.get('/', economicsController.showEconomicsPage);

module.exports = router;