const express = require('express');
const router  = express.Router();
const { showEconomicsPage } = require('../controllers/economicsController');

// GET /economics
router.get('/', showEconomicsPage);

module.exports = router;