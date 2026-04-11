/**
 * Companion Crops API Routes
 * Handles all companion planting endpoints
 */

const express = require('express');
const router = express.Router();
const CompanionCrop = require('../models/CompanionCrop');
const Crop = require('../models/Crop');

// ============================================================
// GET /api/companions - Get all companion relationships
// ============================================================

/**
 * Query parameters:
 * - arrangement: Filter by spatial arrangement
 * - minScore: Minimum compatibility score
 * - pestControl: Filter for pest control benefit (true/false)
 * - nitrogenFixation: Filter for nitrogen fixation (true/false)
 */
router.get('/', async (req, res) => {
  try {
    const {
      arrangement,
      minScore,
      pestControl,
      nitrogenFixation
    } = req.query;

    // Build query
    const query = {};

    if (arrangement) {
      query.spatialArrangement = arrangement;
    }

    if (minScore) {
      query.compatibilityScore = { $gte: parseFloat(minScore) };
    }

    if (pestControl === 'true') {
      query.pestControl = true;
    }

    if (nitrogenFixation === 'true') {
      query.nitrogenFixation = true;
    }

    // Execute query with population
    const companions = await CompanionCrop.find(query)
      .populate('primaryCropId companionCropId')
      .sort({ compatibilityScore: -1 });

    res.json({
      success: true,
      count: companions.length,
      data: companions
    });

  } catch (error) {
    console.error('Error fetching companion crops:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companion crops',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/companions/for-crop/:cropId - Get companions for a crop
// ============================================================

/**
 * Query parameters:
 * - minScore: Minimum compatibility score (default: 60)
 */
router.get('/for-crop/:cropId', async (req, res) => {
  try {
    const { cropId } = req.params;
    const minScore = req.query.minScore ? parseFloat(req.query.minScore) : 60;

    // Verify crop exists
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Find companions
    const companions = await CompanionCrop.findCompanionsFor(cropId, minScore);

    // Get statistics
    const stats = await CompanionCrop.getCompanionStats(cropId);

    res.json({
      success: true,
      crop: {
        id: crop._id,
        name_en: crop.name_en,
        name_zh: crop.name_zh,
        category: crop.category
      },
      minScore: minScore,
      count: companions.length,
      stats: stats,
      data: companions
    });

  } catch (error) {
    console.error('Error fetching companions for crop:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companions for crop',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/companions/best/:cropId - Get best companions (score >= 75)
// ============================================================

router.get('/best/:cropId', async (req, res) => {
  try {
    const { cropId } = req.params;

    // Verify crop exists
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Find best companions
    const companions = await CompanionCrop.findBestCompanionsFor(cropId);

    res.json({
      success: true,
      crop: {
        id: crop._id,
        name_en: crop.name_en,
        name_zh: crop.name_zh
      },
      threshold: 75,
      count: companions.length,
      data: companions
    });

  } catch (error) {
    console.error('Error fetching best companions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching best companions',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/companions/arrangement/:cropId/:arrangement - By arrangement type
// ============================================================

router.get('/arrangement/:cropId/:arrangement', async (req, res) => {
  try {
    const { cropId, arrangement } = req.params;

    // Validate arrangement
    const validArrangements = ['intercrop', 'understory', 'rotation', 'border', 'mixed'];
    if (!validArrangements.includes(arrangement)) {
      return res.status(400).json({
        success: false,
        message: `Invalid arrangement. Must be one of: ${validArrangements.join(', ')}`
      });
    }

    // Verify crop exists
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Find companions by arrangement
    const companions = await CompanionCrop.findByArrangement(cropId, arrangement);

    res.json({
      success: true,
      crop: {
        id: crop._id,
        name_en: crop.name_en,
        name_zh: crop.name_zh
      },
      arrangement: arrangement,
      count: companions.length,
      data: companions
    });

  } catch (error) {
    console.error('Error fetching companions by arrangement:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companions by arrangement',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/companions/nitrogen-fixers/:cropId - Get nitrogen fixers
// ============================================================

router.get('/nitrogen-fixers/:cropId', async (req, res) => {
  try {
    const { cropId } = req.params;

    // Verify crop exists
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Find nitrogen fixers
    const companions = await CompanionCrop.findNitrogenFixers(cropId);

    res.json({
      success: true,
      crop: {
        id: crop._id,
        name_en: crop.name_en,
        name_zh: crop.name_zh
      },
      count: companions.length,
      data: companions
    });

  } catch (error) {
    console.error('Error fetching nitrogen fixers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nitrogen fixers',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/companions/pest-controllers/:cropId - Get pest controllers
// ============================================================

router.get('/pest-controllers/:cropId', async (req, res) => {
  try {
    const { cropId } = req.params;

    // Verify crop exists
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Find pest controllers
    const companions = await CompanionCrop.findPestControllers(cropId);

    res.json({
      success: true,
      crop: {
        id: crop._id,
        name_en: crop.name_en,
        name_zh: crop.name_zh
      },
      count: companions.length,
      data: companions
    });

  } catch (error) {
    console.error('Error fetching pest controllers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pest controllers',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/companions/stats/:cropId - Get companion statistics
// ============================================================

router.get('/stats/:cropId', async (req, res) => {
  try {
    const { cropId } = req.params;

    // Verify crop exists
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Get statistics
    const stats = await CompanionCrop.getCompanionStats(cropId);

    res.json({
      success: true,
      crop: {
        id: crop._id,
        name_en: crop.name_en,
        name_zh: crop.name_zh
      },
      data: stats
    });

  } catch (error) {
    console.error('Error fetching companion stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companion stats',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/companions/top/pairings - Get top companion pairings
// ============================================================

/**
 * Query parameters:
 * - limit: Number of results (default: 10)
 */
router.get('/top/pairings', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topPairings = await CompanionCrop.find({})
      .populate('primaryCropId companionCropId')
      .sort({ compatibilityScore: -1 })
      .limit(limit);

    res.json({
      success: true,
      count: topPairings.length,
      data: topPairings
    });

  } catch (error) {
    console.error('Error fetching top pairings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top pairings',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/companions/:id/companions - Get all companions for a crop
// ============================================================
// ⚠️  MUST stay above GET /:id — Express matches routes top-to-bottom,
//     so "/:id/companions" would otherwise be swallowed by "/:id".

router.get('/:id/companions', async (req, res) => {
  try {
    const cropId = req.params.id;

    // Find companion relationships using model fields primaryCropId/companionCropId
    const companions = await CompanionCrop.find({
      $or: [
        { primaryCropId: cropId },
        { companionCropId: cropId }
      ]
    })
      .populate('primaryCropId companionCropId')
      .sort({ compatibilityScore: -1 });

    // Get the main crop
    const mainCrop = await Crop.findById(cropId);
    if (!mainCrop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    // Format companion data — always return the *other* crop in the pair
    const companionData = companions.map(comp => {
      const isPrimary = comp.primaryCropId._id.toString() === cropId;
      const companion = isPrimary ? comp.companionCropId : comp.primaryCropId;
      return {
        crop: {
          id: companion._id,
          name_en: companion.name_en,
          name_zh: companion.name_zh,
          category: companion.category,
          imageUrl: companion.imageUrl
        },
        compatibilityScore: comp.compatibilityScore,
        benefits: comp.benefits_en ? [comp.benefits_en] : [],
        plantingNotes: comp.plantingTimingNotes || comp.plantingNotes || '',
        spacing: comp.spacingRecommendation || comp.spacing || ''
      };
    });

    res.json({
      success: true,
      mainCrop: {
        id: mainCrop._id,
        name_en: mainCrop.name_en,
        name_zh: mainCrop.name_zh
      },
      companions: companionData
    });

  } catch (error) {
    console.error('Error fetching companions:', error);
    res.status(500).json({ error: 'Failed to fetch companion crops' });
  }
});

// ============================================================
// GET /api/companions/:id - Get single companion relationship by ID
// ============================================================
// ⚠️  Keep this LAST among /:id* routes — it is the most general wildcard.

router.get('/:id', async (req, res) => {
  try {
    const companion = await CompanionCrop.findById(req.params.id)
      .populate('primaryCropId companionCropId');

    if (!companion) {
      return res.status(404).json({
        success: false,
        message: 'Companion relationship not found'
      });
    }

    // Include virtual fields
    const companionData = companion.toObject({ virtuals: true });

    res.json({
      success: true,
      data: companionData
    });

  } catch (error) {
    console.error('Error fetching companion relationship:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companion relationship',
      error: error.message
    });
  }
});

module.exports = router;