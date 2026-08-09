/**
 * Advisor Page Routes
 * AI crop advisor chat — requires login so farm context can be injected
 */

const express      = require('express');
const router       = express.Router();
const FarmProfile  = require('../models/FarmProfile');

function ensureAuthenticated(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Please sign in to use the AI advisor | 請登入以使用AI顧問');
    return res.redirect('/auth/login');
  }
  next();
}

// GET /advisor — chat page
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const farmProfile = await FarmProfile.findOne({ userId: req.session.user._id });

    res.render('advisor', {
      title:  'AI Crop Advisor | AI作物顧問',
      page:   'advisor',
      elevation: farmProfile?.location?.elevation ?? null,
      zone:      farmProfile?.location?.altitudeZone || null,
      savedCrops:   (farmProfile?.crops   || []).map(c => c.cropName).filter(Boolean),
      savedCoffees: (farmProfile?.coffees || []).map(c => c.coffeeName).filter(Boolean)
    });
  } catch (error) {
    console.error('Advisor page error:', error);
    res.status(500).render('error', {
      title:   'Error',
      page:    'error',
      message: 'Failed to load advisor page',
      error:   { status: 500, stack: error.stack }
    });
  }
});

module.exports = router;