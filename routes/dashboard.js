/**
 * Dashboard Routes
 * Personalised farm dashboard for logged-in users
 */

const express    = require('express');
const router     = express.Router();
const FarmProfile = require('../models/FarmProfile');
const { getRecommendations } = require('../data/altitudeLookup');

// ── Auth middleware ───────────────────────────────────────────
function ensureAuthenticated(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Please sign in to access your dashboard | 請登入以查看儀表板');
    return res.redirect('/auth/login');
  }
  next();
}

// ── Safe climate fetch (non-fatal if API is down) ────────────
async function safeGetClimate(lat, lng) {
  try {
    const { getTaiwanClimateData } = require('../utils/apiClients');
    return await getTaiwanClimateData(lat, lng);
  } catch (err) {
    console.warn('Climate API unavailable (non-fatal):', err.message);
    return null;
  }
}

// ── Build weather payload ─────────────────────────────────────
function buildWeatherPayload(climateData, elevation) {
  // Fallback weather when API is unavailable
  if (!climateData) {
    const baseTemp = elevation
      ? Math.max(8, 28 - (elevation / 100))  // rough altitude correction
      : 22;
    const today = new Date();
    return {
      currentTemp: Math.round(baseTemp),
      condition:   'Mild',
      humidity:    70,
      source:      'estimated',
      forecast: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return {
          day:       d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          temp:      Math.round(baseTemp + Math.sin(i) * 2),
          condition: i % 3 === 0 ? 'Rainy' : i % 2 === 0 ? 'Cloudy' : 'Sunny',
          weatherEmoji: i % 3 === 0 ? '🌧️' : i % 2 === 0 ? '⛅' : '☀️',
          rain:      i % 3 === 0 ? 60 : 10,
          harvestOptimal: false
        };
      })
    };
  }

  const currentTemp = climateData.annual.avgTemp;
  const humidity    = climateData.annual.avgHumidity;
  let condition = 'Mild';
  if (climateData.analysis?.heatStress === 'High')  condition = 'Hot';
  if (climateData.analysis?.frostRisk  === 'High')  condition = 'Cool';

  const today = new Date();
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const offset = Math.sin((i / 6) * Math.PI) * 2;
    const temp   = Math.round((currentTemp + offset) * 10) / 10;
    const isRainy = i % 3 === 0;
    return {
      day:       d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      temp,
      condition: isRainy ? 'Rainy' : i % 2 === 0 ? 'Sunny' : 'Partly Cloudy',
      weatherEmoji: isRainy ? '🌧️' : i % 2 === 0 ? '☀️' : '⛅',
      rain:      isRainy ? 60 : 10,
      harvestOptimal: temp >= 18 && temp <= 26 && !isRainy
    };
  });

  return { currentTemp, condition, humidity, source: 'live', forecast };
}

// ============================================================
// GET /dashboard — Main personalised dashboard
// ============================================================
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // ── Load farm profile ─────────────────────────────────────
    const uid = req.session.user._id;
    let farmProfile = await FarmProfile.findOne({ userId: uid });
    if (!farmProfile) {
      const mongoose = require('mongoose');
      if (mongoose.isValidObjectId(uid)) {
        farmProfile = await FarmProfile.findOne({
          userId: new mongoose.Types.ObjectId(uid)
        });
      }
    }

    // ── No profile or no location → redirect ─────────────────
    if (!farmProfile || !farmProfile.location?.coordinates?.lat) {
      req.flash('info', 'Let\'s set up your farm profile | 先設定您的農場資料');
      return res.redirect('/location');
    }

    const { lat, lng } = farmProfile.location.coordinates;
    const elevation    = farmProfile.location.elevation || 0;

    // ── Weather (non-fatal) ───────────────────────────────────
    const climateData = await safeGetClimate(lat, lng);
    const weather     = buildWeatherPayload(climateData, elevation);

    // ── Altitude zone info ────────────────────────────────────
    const lookup   = getRecommendations(elevation, 3, 3);
    const zone     = lookup.zone;
    const zoneData = lookup.zoneData;

    // ── Crop + coffee counts ──────────────────────────────────
    const cropCount   = (farmProfile.crops   || []).length;
    const coffeeCount = (farmProfile.coffees || []).length;

    // ── Alerts ───────────────────────────────────────────────
    const alerts = [];
    if (weather.condition === 'Cool' || elevation > 1200) {
      alerts.push({ type: 'frost', message: 'Cool temperatures — consider frost protection tonight | 今晚注意防霜' });
    }
    if (cropCount === 0) {
      alerts.push({ type: 'setup', message: 'No crops saved yet — visit Crops to add some | 尚未儲存作物' });
    }

    // ── Render ────────────────────────────────────────────────
    res.render('dashboard', {
      title:       'My Farm Dashboard | 我的農場',
      page:        'dashboard',
      user:        req.session.user,
      farmProfile,
      weather,
      alerts,
      zone,
      zoneData,
      elevation,
      cropCount,
      coffeeCount,
      remainingCropSlots:   Math.max(0, 8 - cropCount),
      remainingCoffeeSlots: Math.max(0, 5 - coffeeCount),
      atCropCap:   cropCount   >= 8,
      atCoffeeCap: coffeeCount >= 5
    });

  } catch (error) {
    console.error('Dashboard render error:', error);
    res.status(500).render('error', {
      title:   'Dashboard Error',
      page:    'error',
      message: 'Failed to load your dashboard. Please try again.',
      error:   process.env.NODE_ENV === 'development' ? error : { status: 500 }
    });
  }
});

// ============================================================
// POST /dashboard/update-location — Update farm location
// ============================================================
router.post('/update-location', ensureAuthenticated, async (req, res) => {
  try {
    const { lat, lng, elevation, address } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Location data missing' });
    }

    const { getZoneFromElevation } = require('../data/altitudeLookup');
    const altitudeZone = getZoneFromElevation(parseFloat(elevation) || 0);

    const farmProfile = await FarmProfile.findOne({ userId: req.session.user._id });
    if (!farmProfile) {
      return res.status(404).json({ success: false, message: 'Farm profile not found' });
    }

    // Update location — clear crops and coffees since zone may have changed
    farmProfile.location = {
      address:     address || '',
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
      elevation:   parseFloat(elevation) || 0,
      altitudeZone
    };
    farmProfile.crops   = [];
    farmProfile.coffees = [];

    await farmProfile.save();

    // Update session location too
    req.session.location = {
      lat:       parseFloat(lat),
      lng:       parseFloat(lng),
      elevation: parseFloat(elevation) || 0,
      address:   address || ''
    };

    res.json({
      success:  true,
      message:  'Location updated — please re-select your crops | 位置已更新，請重新選擇作物',
      redirect: '/crops'
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: 'Failed to update location', error: error.message });
  }
});

// ============================================================
// POST /dashboard/update-farm-name — Update farm name
// ============================================================
router.post('/update-farm-name', ensureAuthenticated, async (req, res) => {
  try {
    const { farmName } = req.body;
    if (!farmName || !farmName.trim()) {
      return res.status(400).json({ success: false, message: 'Farm name cannot be empty' });
    }

    await FarmProfile.findOneAndUpdate(
      { userId: req.session.user._id },
      { farmName: farmName.trim() }
    );

    res.json({ success: true, message: 'Farm name updated | 農場名稱已更新', farmName: farmName.trim() });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update farm name' });
  }
});

// ============================================================
// GET /dashboard/api/summary — AI daily brief
// ============================================================
router.get('/api/summary', ensureAuthenticated, async (req, res) => {
  try {
    const farmProfile = await FarmProfile.findOne({ userId: req.session.user._id });
    if (!farmProfile?.location?.coordinates) {
      return res.status(400).json({ success: false, message: 'Please set your farm location first' });
    }

    const { lat, lng } = farmProfile.location.coordinates;
    const elevation    = farmProfile.location.elevation || 0;
    const climateData  = await safeGetClimate(lat, lng);
    const weather      = buildWeatherPayload(climateData, elevation);

    // Try AI advisor — fall back to static summary if unavailable
    let summary;
    try {
      const aiAdvisor = require('../utils/aiAdvisor');
      summary = await aiAdvisor.getDailyBrief(farmProfile, weather);
    } catch (err) {
      const cropNames = (farmProfile.crops || []).map(c => c.cropName).join(', ') || 'your crops';
      summary = `Good day! Your farm at ${elevation}m is in the ${farmProfile.location?.altitudeZone || 'mountain'} zone. `
              + `Current temperature: ${weather.currentTemp}°C. `
              + `You have ${farmProfile.crops?.length || 0} crop(s) saved: ${cropNames}. `
              + `Visit the Crops page to manage your selections.`;
    }

    res.json({ success: true, data: { summary } });

  } catch (error) {
    console.error('AI daily brief error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate AI brief', error: error.message });
  }
});

module.exports = router;