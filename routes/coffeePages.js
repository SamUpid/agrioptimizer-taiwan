const express = require('express');
const router = express.Router();
const coffeeController = require('../controllers/coffeeController');

// GET /coffee - Show coffee varieties
router.get('/', coffeeController.showCoffeePage);

// GET /coffee/:id - Show coffee detail
router.get('/:id', coffeeController.showCoffeeDetail);

module.exports = router;