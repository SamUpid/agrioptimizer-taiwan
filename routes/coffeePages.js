const express = require('express');
const router  = express.Router();
const coffeeController = require('../controllers/coffeeController');

router.get('/',         coffeeController.showCoffeePage);
router.get('/:id',      coffeeController.showCoffeeDetail);
router.post('/save',    coffeeController.saveCoffee);
router.delete('/remove', coffeeController.removeCoffee);

module.exports = router;