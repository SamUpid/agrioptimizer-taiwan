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
const { getRecommendations } = require('../data/altitudeLookup');
const { getTopSuitableCrops, calculateSuitability } = require('../utils/suitability');

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

    // ── Get lookup table recommendations (always works) ──────
    const lookup = getRecommendations(elevation, 8, 5);

    // ── Try to enrich with DB data (imageUrl, marketPrice etc) ─
    // Match lookup crop names to DB records to get full data
    const allDbCrops = await Crop.find({}).lean();

    const enrichedCrops = lookup.crops.map(lookupCrop => {
      // Try to find matching DB record by English name
      const dbMatch = allDbCrops.find(db =>
        db.name_en?.toLowerCase().includes(lookupCrop.cropName.toLowerCase()) ||
        lookupCrop.cropName.toLowerCase().includes(db.name_en?.toLowerCase())
      );

      return {
        // Lookup table data (always present)
        cropName:         lookupCrop.cropName,
        cropNameZh:       lookupCrop.cropNameZh,
        imageUrl:         lookupCrop.imageUrl,
        suitabilityScore: lookupCrop.suitabilityScore,
        reason:           lookupCrop.reason,
        reasonZh:         lookupCrop.reasonZh,
        altitudeZone:     lookup.zone,

        // DB enrichment (if matched)
        _id:              dbMatch?._id || null,
        category:         dbMatch?.category || 'specialty',
        difficultyLevel:  dbMatch?.difficultyLevel || 'moderate',
        marketPriceMin:   dbMatch?.marketPriceMin || null,
        marketPriceMax:   dbMatch?.marketPriceMax || null,
        expectedYield:    dbMatch?.expectedYield || null,
        growingSeason:    dbMatch?.growingSeason || null,
        breakEvenMonths:  dbMatch?.breakEvenMonths || null,
        marketDemandIndex: dbMatch?.marketDemandIndex || null
      };
    });

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
      zone:        lookup.zone,
      zoneData:    lookup.zoneData,
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

    const { cropName, cropNameZh, imageUrl, altitudeZone } = req.body;

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