/**
 * Crops Controller
 * Handles crop recommendations based on location/elevation
 *
 * UPDATED: Now uses altitudeLookup.js as primary recommendation engine
 * - Works for guests (no login required)
 * - Works without climate data (elevation only)
 * - Falls back to DB suitability when climate data is available
 * - Logged-in users can save selections (max 8 crops)
 */

const mongoose       = require('mongoose');
const Crop           = require('../models/Crop');
const FarmProfile    = require('../models/FarmProfile');
const CompanionCrop  = require('../models/CompanionCrop');
const Location       = require('../models/Location');
const { getZoneFromElevation, ALTITUDE_ZONES } = require('../data/altitudeLookup');
const { getTopSuitableCrops, calculateSuitability, calculateElevationMatch } = require('../utils/suitability');

// ============================================================
// HELPER: get elevation from session
// ============================================================
function getElevationFromSession(req) {
  const loc = req.session.location;
  if (!loc) return null;
  // Support both shapes: { elevation } and { elevation: { value } }
  if (typeof loc.elevation === 'number') return loc.elevation;
  if (loc.elevation && typeof loc.elevation.value === 'number') return loc.elevation.value;
  return null;
}

// ============================================================
// GET /crops — Show crop recommendations page
// ============================================================
exports.showCropsPage = async (req, res) => {
  try {
    const location  = req.session.location;
    const elevation = getElevationFromSession(req);

    // ── No location at all → redirect ───────────────────────
    if (!location || !location.lat || !location.lng) {
      req.flash('error', 'Please select your farm location first | 請先選擇農場位置');
      return res.redirect('/location');
    }

    // ── No elevation → redirect back to location ─────────────
    if (elevation === null) {
      req.flash('error', 'Elevation data is missing. Please re-confirm your location | 缺少海拔資料，請重新確認位置');
      return res.redirect('/location');
    }

    // ── Zone metadata (descriptive only — not the source of items) ──
    const zone     = getZoneFromElevation(elevation);
    const zoneMeta = ALTITUDE_ZONES[zone];

    // ── Try to get cached climate data for full temp/rainfall scoring ──
    let climate = null;
    try {
      const dbLocation = await Location.findByCoordinates(location.lat, location.lng, 0.01);
      if (dbLocation?.climateData) {
        climate = {
          avgTemp:        dbLocation.climateData.annualTemp,
          minTemp:        Math.min(...dbLocation.climateData.monthlyTemps),
          maxTemp:        Math.max(...dbLocation.climateData.monthlyTemps),
          annualRainfall: dbLocation.climateData.annualRainfall
        };
      }
    } catch (err) {
      console.error('Climate lookup error (non-fatal):', err);
    }

    // ── Score EVERY crop in the database against this elevation ──────
    // (No static lookup list — every item shown genuinely exists in the DB,
    //  and scores recompute for whatever elevation is currently saved.)
    const allDbCrops = await Crop.find({});

    let scoredCrops = allDbCrops.map(cropDoc => {
      const crop = cropDoc.toObject();
      let suitabilityScore, reason, reasonZh;

      if (climate) {
        const result = calculateSuitability(climate, elevation, crop);
        suitabilityScore = result.score;
        reason   = `Temperature match ${result.breakdown.temperature}%, rainfall match ${result.breakdown.rainfall}%`;
        reasonZh = `溫度適配度 ${result.breakdown.temperature}%，降雨適配度 ${result.breakdown.rainfall}%`;
      } else {
        // No cached climate data yet — score by elevation fit + market factor
        const elevationScore = calculateElevationMatch(elevation, crop);
        const avgPrice  = ((crop.marketPriceMin || 0) + (crop.marketPriceMax || 0)) / 2;
        const marketScore = Math.min(100, (avgPrice / 50) * 100);
        suitabilityScore = Math.round(elevationScore * 0.8 + marketScore * 0.2);
        reason   = `Thrives between ${crop.minElevation}-${crop.maxElevation}m elevation`;
        reasonZh = `適合種植於海拔 ${crop.minElevation}-${crop.maxElevation} 公尺`;
      }

      return {
        cropName:          crop.name_en,
        cropNameZh:         crop.name_zh,
        imageUrl:           crop.imageUrl,
        suitabilityScore,
        reason,
        reasonZh,
        altitudeZone:       zone,

        _id:                crop._id,
        category:           crop.category || 'specialty',
        difficultyLevel:    crop.difficultyLevel || 'moderate',
        marketPriceMin:     crop.marketPriceMin ?? null,
        marketPriceMax:     crop.marketPriceMax ?? null,
        expectedYield:      crop.expectedYield ?? null,
        growingSeason:      crop.growingSeason ?? null,
        breakEvenMonths:    crop.breakEvenMonths ?? null,
        marketDemandIndex:  crop.marketDemandIndex ?? null
      };
    });

    // ── Keep only crops that are a genuine match for this elevation ──
    // Fall back to "closest matches" if too few clear it (e.g. extreme elevations)
    scoredCrops.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    let enrichedCrops = scoredCrops.filter(c => c.suitabilityScore >= 40);
    if (enrichedCrops.length < 5) {
      enrichedCrops = scoredCrops.slice(0, 8);
    } else {
      enrichedCrops = enrichedCrops.slice(0, 15);
    }

    // ── Get user's saved crops if logged in ──────────────────
    let savedCropNames = [];
    let savedCount     = 0;
    let farmProfile    = null;

    if (req.session.user) {
      try {
        farmProfile = await FarmProfile.findOne({
          userId: req.session.user._id
        }).lean();

        if (farmProfile?.crops?.length) {
          savedCropNames = farmProfile.crops.map(c => c.cropName);
          savedCount     = farmProfile.crops.length;
        }
      } catch (err) {
        console.error('FarmProfile lookup error:', err);
        // Non-fatal — continue without saved data
      }
    }

    // ── Category filter ──────────────────────────────────────
    const category = req.query.category || 'all';
    const search   = req.query.search   || '';
    const sortBy   = req.query.sort     || 'suitability';

    let displayCrops = [...enrichedCrops];

    if (category !== 'all') {
      displayCrops = displayCrops.filter(
        c => c.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search) {
      const s = search.toLowerCase();
      displayCrops = displayCrops.filter(
        c => c.cropName?.toLowerCase().includes(s) ||
             c.cropNameZh?.includes(s)
      );
    }

    if (sortBy === 'price') {
      displayCrops.sort((a, b) => (b.marketPriceMax || 0) - (a.marketPriceMax || 0));
    } else if (sortBy === 'difficulty') {
      const order = { easy: 1, moderate: 2, hard: 3 };
      displayCrops.sort((a, b) =>
        (order[a.difficultyLevel] || 2) - (order[b.difficultyLevel] || 2)
      );
    }
    // Default: already sorted by suitabilityScore from lookup

    // ── Render ───────────────────────────────────────────────
    res.render('crops', {
      title:       'Crop Recommendations | 作物建議',
      page:        'crops',
      location,
      elevation,
      zone,
      zoneData: {
        label:         zoneMeta.label,
        labelZh:       zoneMeta.labelZh,
        description:   zoneMeta.description,
        descriptionZh: zoneMeta.descriptionZh,
        range:         zoneMeta.range
      },
      crops:       displayCrops,
      topCrops:    displayCrops.slice(0, 3),
      category,
      sortBy,
      search,
      categories:  ['all', 'fruit', 'vegetable', 'herb', 'specialty', 'grain'],

      // User state
      isLoggedIn:     !!req.session.user,
      savedCropNames,
      savedCount,
      canAddMore:     savedCount < 8,
      remainingSlots: Math.max(0, 8 - savedCount)
    });

  } catch (error) {
    console.error('Error rendering crops page:', error);
    req.flash('error', 'Failed to load crop recommendations | 無法載入作物建議');
    res.status(500).render('error', {
      title:   'Error',
      page:    'error',
      message: 'Failed to load crop recommendations',
      error:   { status: 500, stack: error.stack }
    });
  }
};

// ============================================================
// POST /crops/save — Save a crop to user's farm profile
// ============================================================
exports.saveCrop = async (req, res) => {
  try {
    // Must be logged in
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to save crops | 請登入以儲存作物'
      });
    }

    const { cropName, cropNameZh, imageUrl, altitudeZone, cropId } = req.body;

    if (!cropName) {
      return res.status(400).json({
        success: false,
        message: 'Crop name is required | 需要作物名稱'
      });
    }

    // Find or create farm profile
    const userId = req.session.user._id;
    // Try both ObjectId and string — locationController may have saved either
    let farmProfile = await FarmProfile.findOne({ userId: userId });
    if (!farmProfile && mongoose.isValidObjectId(userId)) {
      farmProfile = await FarmProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId)
      });
    }

    if (!farmProfile) {
      // Auto-create from session location
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

    // ── Check cap ────────────────────────────────────────────
    if (farmProfile.crops.length >= 8) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 8 crops reached. Delete one to add another | 已達8種作物上限，請先刪除一個'
      });
    }

    // ── Check duplicate ──────────────────────────────────────
    const alreadySaved = farmProfile.crops.some(
      c => c.cropName === cropName
    );

    if (alreadySaved) {
      return res.status(400).json({
        success: false,
        message: 'This crop is already saved | 此作物已儲存'
      });
    }

    // ── Add crop ─────────────────────────────────────────────
    const validZones = ['lowland', 'mid', 'high', 'alpine'];
    farmProfile.crops.push({
      cropId: mongoose.isValidObjectId(cropId) ? cropId : undefined,
      cropName,
      cropNameZh: cropNameZh || '',
      imageUrl:   imageUrl   || '',
      altitudeZone: validZones.includes(altitudeZone) ? altitudeZone : undefined
    });

    // Mark setup complete if first crop added
    if (!farmProfile.setupComplete && farmProfile.crops.length >= 1) {
      farmProfile.setupComplete = true;
    }

    await farmProfile.save();

    res.json({
      success:        true,
      message:        `${cropName} saved to your farm | 已儲存到您的農場`,
      savedCount:     farmProfile.crops.length,
      remainingSlots: Math.max(0, 8 - farmProfile.crops.length),
      atCap:          farmProfile.crops.length >= 8
    });

  } catch (error) {
    console.error('Error saving crop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save crop | 儲存作物失敗',
      error:   error.message
    });
  }
};

// ============================================================
// DELETE /crops/remove — Remove a crop from farm profile
// ============================================================
exports.removeCrop = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Please log in | 請登入'
      });
    }

    const { cropName } = req.body;

    const userId2 = req.session.user._id;
    let farmProfile = await FarmProfile.findOne({ userId: userId2 });
    if (!farmProfile && mongoose.isValidObjectId(userId2)) {
      farmProfile = await FarmProfile.findOne({
        userId: new mongoose.Types.ObjectId(userId2)
      });
    }

    if (!farmProfile) {
      return res.status(404).json({
        success: false,
        message: 'Farm profile not found | 找不到農場檔案'
      });
    }

    const beforeCount = farmProfile.crops.length;
    farmProfile.crops = farmProfile.crops.filter(
      c => c.cropName !== cropName
    );

    if (farmProfile.crops.length === beforeCount) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found in your profile | 在您的檔案中找不到此作物'
      });
    }

    await farmProfile.save();

    res.json({
      success:        true,
      message:        `${cropName} removed | 已移除`,
      savedCount:     farmProfile.crops.length,
      remainingSlots: Math.max(0, 8 - farmProfile.crops.length),
      atCap:          false
    });

  } catch (error) {
    console.error('Error removing crop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove crop | 移除作物失敗',
      error:   error.message
    });
  }
};

// ============================================================
// GET /crops/:id — Show single crop detail (unchanged)
// ============================================================
exports.showCropDetail = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      req.flash('error', 'Crop not found');
      return res.status(404).render('error', {
        title:   'Not Found',
        page:    'error',
        message: 'Crop not found',
        error:   { status: 404 }
      });
    }

    const location  = req.session.location;
    const elevation = getElevationFromSession(req);
    let suitability = null;

    if (location && elevation !== null) {
      try {
        const dbLocation = await Location.findByCoordinates(
          location.lat, location.lng, 0.01
        );

        if (dbLocation?.climateData) {
          const climate = {
            avgTemp:       dbLocation.climateData.annualTemp,
            minTemp:       Math.min(...dbLocation.climateData.monthlyTemps),
            maxTemp:       Math.max(...dbLocation.climateData.monthlyTemps),
            annualRainfall: dbLocation.climateData.annualRainfall
          };
          suitability = calculateSuitability(climate, elevation, crop);
        }
      } catch (err) {
        console.error('Climate lookup error (non-fatal):', err);
      }
    }

    // Fetch companion crops
    let companions = [];
    try {
      const companionRecords = await CompanionCrop.find({
        $or: [
          { primaryCropId:   crop._id },
          { companionCropId: crop._id }
        ]
      })
        .populate('primaryCropId companionCropId')
        .sort({ compatibilityScore: -1 });

      companions = companionRecords.map(comp => {
        const isPrimary = comp.primaryCropId._id.toString() === crop._id.toString();
        const companion = isPrimary ? comp.companionCropId : comp.primaryCropId;
        return {
          crop: {
            id:       companion._id,
            name_en:  companion.name_en,
            name_zh:  companion.name_zh,
            category: companion.category,
            imageUrl: companion.imageUrl
          },
          compatibilityScore: comp.compatibilityScore,
          benefits:     comp.benefits_en ? [comp.benefits_en] : [],
          plantingNotes: comp.plantingTimingNotes || comp.plantingNotes || '',
          spacing:      comp.spacingRecommendation || comp.spacing || ''
        };
      });
    } catch (err) {
      console.error('Error fetching companions (non-fatal):', err);
    }

    res.render('cropDetail', {
      title:      crop.name_en,
      page:       'crops',
      crop,
      suitability,
      location,
      elevation,
      companions,
      isLoggedIn: !!req.session.user
    });

  } catch (error) {
    console.error('Error rendering crop detail:', error);
    req.flash('error', 'Failed to load crop details');
    res.status(500).render('error', {
      title:   'Error',
      page:    'error',
      message: 'Failed to load crop details',
      error:   { status: 500, stack: error.stack }
    });
  }
};