/**
 * Coffee Controller
 * Updated to use altitudeLookup.js as primary engine
 * Works for guests — elevation only, no climate data needed
 * Logged-in users can save up to 5 coffee varieties
 */

const mongoose       = require('mongoose');
const CoffeeVariety  = require('../models/CoffeeVariety');
const FarmProfile    = require('../models/FarmProfile');
const { getZoneFromElevation, ALTITUDE_ZONES } = require('../data/altitudeLookup');
const { calculateCoffeeSuitability } = require('../utils/suitability');

// ── HELPER ────────────────────────────────────────────────────
function getElevationFromSession(req) {
  const loc = req.session.location;
  if (!loc) return null;
  if (typeof loc.elevation === 'number') return loc.elevation;
  if (loc.elevation && typeof loc.elevation.value === 'number') return loc.elevation.value;
  return null;
}

// ============================================================
// GET /coffee — Show coffee recommendations page
// ============================================================
exports.showCoffeePage = async (req, res) => {
  try {
    const location  = req.session.location;
    const elevation = getElevationFromSession(req);

    if (!location || !location.lat || !location.lng) {
      req.flash('error', 'Please select your farm location first | 請先選擇農場位置');
      return res.redirect('/location');
    }

    if (elevation === null) {
      req.flash('error', 'Elevation data missing. Please re-confirm your location | 缺少海拔資料');
      return res.redirect('/location');
    }

    // ── Zone metadata (descriptive only) ──────────────────────
    const zone = getZoneFromElevation(elevation);

    // ── Score EVERY coffee variety in the database against this elevation ──
    const allDbCoffee = await CoffeeVariety.find({});

    let scoredCoffees = allDbCoffee.map(coffeeDoc => {
      const coffee = coffeeDoc.toObject();
      const result  = calculateCoffeeSuitability(elevation, coffee);

      const displayName = /coffee|arabica/i.test(coffee.varietyName)
        ? coffee.varietyName
        : `${coffee.varietyName} Coffee`;

      return {
        coffeeName:       displayName,
        coffeeNameZh:     coffee.varietyName_zh,
        imageUrl:         coffee.imageUrl,
        variety:          coffee.varietyName,
        suitabilityScore: result.score,
        reason:           `Elevation match ${result.elevationScore}%, cup quality potential ${result.qualityScore}%`,
        reasonZh:         `海拔適配度 ${result.elevationScore}%，杯測品質潛力 ${result.qualityScore}%`,
        altitudeZone:     zone,

        _id:                   coffee._id,
        optimalElevationMin:   coffee.optimalElevationMin ?? null,
        optimalElevationMax:   coffee.optimalElevationMax ?? null,
        flavorNotes_en:        coffee.flavorNotes_en || null,
        flavorNotes_zh:        coffee.flavorNotes_zh || null,
        qualityTips_en:        coffee.qualityTips_en || null,
        yieldPerTree:          coffee.yieldPerTree ?? null,
        treesPerHectare:       coffee.treesPerHectare ?? null,
        yearsToFirstHarvest:   coffee.yearsToFirstHarvest ?? null,
        diseaseResistance:     coffee.diseaseResistance || null,
        cupQualityMin:         coffee.cupQualityMin ?? null,
        cupQualityMax:         coffee.cupQualityMax ?? null,
        processingMethods:     coffee.processingMethods || [],
        harvestMonths:         coffee.harvestMonths || null
      };
    });

    // ── Keep only genuinely suitable varieties, with a graceful fallback ──
    scoredCoffees.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    let enrichedCoffees = scoredCoffees.filter(c => c.suitabilityScore >= 45);
    if (enrichedCoffees.length < 3) {
      enrichedCoffees = scoredCoffees.slice(0, 5);
    } else {
      enrichedCoffees = enrichedCoffees.slice(0, 8);
    }

    // ── Quality potential label from elevation ────────────────
    function qualityLabel(elev) {
      if (elev >= 1800) return 'Ultra Premium ☕☕☕';
      if (elev >= 1200) return 'Specialty Grade ☕☕';
      if (elev >= 800)  return 'Premium Commercial ☕';
      return 'Standard Commercial';
    }

    // ── User saved coffees ────────────────────────────────────
    let savedCoffeeNames = [];
    let savedCount       = 0;

    if (req.session.user) {
      try {
        const farmProfile = await FarmProfile.findOne({
          userId: req.session.user._id
        }).lean();
        if (farmProfile?.coffees?.length) {
          savedCoffeeNames = farmProfile.coffees.map(c => c.coffeeName);
          savedCount       = farmProfile.coffees.length;
        }
      } catch (err) {
        console.error('FarmProfile lookup error (non-fatal):', err);
      }
    }

    res.render('coffee', {
      title:       'Coffee Varieties | 咖啡品種',
      page:        'coffee',
      location,
      elevation,
      zone,
      zoneData: {
        label:         ALTITUDE_ZONES[zone].label,
        labelZh:       ALTITUDE_ZONES[zone].labelZh,
        description:   ALTITUDE_ZONES[zone].description,
        descriptionZh: ALTITUDE_ZONES[zone].descriptionZh,
        range:         ALTITUDE_ZONES[zone].range
      },
      coffees:     enrichedCoffees,
      topCoffee:   enrichedCoffees[0] || null,
      qualityLabel: qualityLabel(elevation),

      // User state
      isLoggedIn:      !!req.session.user,
      savedCoffeeNames,
      savedCount,
      canAddMore:      savedCount < 5,
      remainingSlots:  Math.max(0, 5 - savedCount)
    });

  } catch (error) {
    console.error('Error rendering coffee page:', error);
    req.flash('error', 'Failed to load coffee varieties | 無法載入咖啡品種');
    res.status(500).render('error', {
      title:   'Error',
      page:    'error',
      message: 'Failed to load coffee varieties',
      error:   { status: 500, stack: error.stack }
    });
  }
};

// ============================================================
// POST /coffee/save — Save a coffee to farm profile (max 5)
// ============================================================
exports.saveCoffee = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to save coffees | 請登入以儲存咖啡品種'
      });
    }

    const { coffeeName, coffeeNameZh, imageUrl, variety, altitudeZone, coffeeId } = req.body;

    if (!coffeeName) {
      return res.status(400).json({
        success: false,
        message: 'Coffee name is required | 需要咖啡名稱'
      });
    }

    const userId = req.session.user._id;
    let farmProfile = await FarmProfile.findOne({ userId: userId });
    if (!farmProfile && mongoose.isValidObjectId(userId)) {
      farmProfile = await FarmProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      });
    }

    if (!farmProfile) {
      const loc = req.session.location;
      farmProfile = new FarmProfile({
        userId:   req.session.user._id,
        farmName: `${req.session.user.name}'s Farm`,
        location: loc ? {
          address:     loc.address || '',
          coordinates: { lat: loc.lat, lng: loc.lng },
          elevation:   getElevationFromSession(req)
        } : {}
      });
    }

    if (farmProfile.coffees.length >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 coffee varieties reached. Delete one to add another | 已達5種上限'
      });
    }

    const alreadySaved = farmProfile.coffees.some(c => c.coffeeName === coffeeName);
    if (alreadySaved) {
      return res.status(400).json({
        success: false,
        message: 'This variety is already saved | 此品種已儲存'
      });
    }

    const validZones = ['lowland', 'mid', 'high', 'alpine'];
    farmProfile.coffees.push({
      coffeeId: mongoose.isValidObjectId(coffeeId) ? coffeeId : undefined,
      coffeeName,
      coffeeNameZh: coffeeNameZh || '',
      imageUrl:     imageUrl     || '',
      variety:      variety      || '',
      altitudeZone: validZones.includes(altitudeZone) ? altitudeZone : undefined
    });

    await farmProfile.save();

    res.json({
      success:        true,
      message:        `${coffeeName} saved | 已儲存`,
      savedCount:     farmProfile.coffees.length,
      remainingSlots: Math.max(0, 5 - farmProfile.coffees.length),
      atCap:          farmProfile.coffees.length >= 5
    });

  } catch (error) {
    console.error('Error saving coffee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save coffee | 儲存失敗',
      error:   error.message
    });
  }
};

// ============================================================
// DELETE /coffee/remove — Remove a coffee from farm profile
// ============================================================
exports.removeCoffee = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'Please log in | 請登入' });
    }

    const { coffeeName } = req.body;

    const userId = req.session.user._id;
    let farmProfile = await FarmProfile.findOne({ userId: userId });
    if (!farmProfile && mongoose.isValidObjectId(userId)) {
      farmProfile = await FarmProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      });
    }
    if (!farmProfile) {
      return res.status(404).json({ success: false, message: 'Farm profile not found' });
    }

    const before = farmProfile.coffees.length;
    farmProfile.coffees = farmProfile.coffees.filter(c => c.coffeeName !== coffeeName);

    if (farmProfile.coffees.length === before) {
      return res.status(404).json({ success: false, message: 'Coffee not found in profile' });
    }

    await farmProfile.save();

    res.json({
      success:        true,
      message:        `${coffeeName} removed | 已移除`,
      savedCount:     farmProfile.coffees.length,
      remainingSlots: Math.max(0, 5 - farmProfile.coffees.length),
      atCap:          false
    });

  } catch (error) {
    console.error('Error removing coffee:', error);
    res.status(500).json({ success: false, message: 'Failed to remove | 移除失敗', error: error.message });
  }
};

// ============================================================
// GET /coffee/:id — Single coffee detail (unchanged logic)
// ============================================================
exports.showCoffeeDetail = async (req, res) => {
  try {
    const coffee    = await CoffeeVariety.findById(req.params.id);
    const location  = req.session.location;
    const elevation = getElevationFromSession(req);

    if (!coffee) {
      return res.status(404).render('error', {
        title: 'Not Found', page: 'error',
        message: 'Coffee variety not found', error: { status: 404 }
      });
    }

    let suitability = null;
    if (elevation !== null) {
      let score = 0;
      if (elevation >= coffee.optimalElevationMin && elevation <= coffee.optimalElevationMax) {
        score = 90;
      } else if (elevation < coffee.optimalElevationMin) {
        score = Math.max(0, 100 - (coffee.optimalElevationMin - elevation) / 10);
      } else {
        score = Math.max(0, 100 - (elevation - coffee.optimalElevationMax) / 10);
      }

      let qualityPotential = 'Standard Commercial';
      if (elevation >= 1800) qualityPotential = 'Ultra Premium ☕☕☕';
      else if (elevation >= 1200) qualityPotential = 'Specialty Grade ☕☕';
      else if (elevation >= 800)  qualityPotential = 'Premium Commercial ☕';

      suitability = { score: Math.round(score), qualityPotential };
    }

    res.render('coffeeDetail', {
      title:      coffee.varietyName,
      page:       'coffee',
      coffee,
      suitability,
      location,
      elevation,
      isLoggedIn: !!req.session.user
    });

  } catch (error) {
    console.error('Error rendering coffee detail:', error);
    res.status(500).render('error', {
      title: 'Error', page: 'error',
      message: 'Failed to load coffee details',
      error: { status: 500, stack: error.stack }
    });
  }
};