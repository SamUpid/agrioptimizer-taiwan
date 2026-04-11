/**
 * Crops API Routes
 * Handles all crop-related endpoints
 */

const express = require('express');
const router = express.Router();
const Crop = require('../models/Crop');

// ============================================================
// GET /api/crops - Get all crops (with optional filtering)
// ============================================================

/**
 * Query parameters:
 * - category: Filter by category (fruit, vegetable, specialty, herb)
 * - difficulty: Filter by difficulty (easy, moderate, hard)
 * - minPrice: Minimum average market price
 * - maxPrice: Maximum average market price
 * - sort: Sort field (name, price, yield, difficulty)
 * - order: Sort order (asc, desc)
 * - limit: Number of results (default: 50)
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      difficulty,
      minPrice,
      maxPrice,
      sort = 'name_en',
      order = 'asc',
      limit = 50
    } = req.query;

    // Build query
    const query = {};

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficultyLevel = difficulty;
    }

    // Price filtering (using average of min/max)
    if (minPrice || maxPrice) {
      // We need to use aggregation for virtual field filtering
      // For now, we'll fetch all and filter in memory
      // (In production, you'd want to optimize this)
    }

    // Build sort object
    const sortObj = {};
    if (sort === 'price') {
      sortObj.marketPriceMin = order === 'asc' ? 1 : -1;
    } else if (sort === 'yield') {
      sortObj.expectedYield = order === 'asc' ? 1 : -1;
    } else if (sort === 'difficulty') {
      sortObj.difficultyLevel = order === 'asc' ? 1 : -1;
    } else {
      sortObj[sort] = order === 'asc' ? 1 : -1;
    }

    // Execute query
    const crops = await Crop.find(query)
      .sort(sortObj)
      .limit(parseInt(limit));

    // Calculate summary statistics
    const total = await Crop.countDocuments(query);
    const avgPrice = crops.length > 0
      ? crops.reduce((sum, crop) => sum + crop.avgMarketPrice, 0) / crops.length
      : 0;

    res.json({
      success: true,
      count: crops.length,
      total: total,
      avgPrice: Math.round(avgPrice),
      data: crops
    });

  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching crops',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/crops/categories - Get all categories with counts
// ============================================================

router.get('/categories', async (req, res) => {
  try {
    const categories = await Crop.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: {
            $avg: { $avg: ['$marketPriceMin', '$marketPriceMax'] }
          },
          crops: { $push: '$name_en' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/crops/suitable - Find suitable crops for location
// ============================================================

/**
 * Query parameters:
 * - elevation: Elevation in meters (required)
 * - avgTemp: Average temperature in °C (required)
 * - annualRainfall: Annual rainfall in mm (required)
 */
router.get('/suitable', async (req, res) => {
  try {
    const { elevation, avgTemp, annualRainfall } = req.query;

    // Validate required parameters
    if (!elevation || !avgTemp || !annualRainfall) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: elevation, avgTemp, annualRainfall'
      });
    }

    // Convert to numbers
    const climate = {
      elevation: parseFloat(elevation),
      avgTemp: parseFloat(avgTemp),
      annualRainfall: parseFloat(annualRainfall)
    };

    // Find suitable crops
    const suitableCrops = await Crop.findSuitableCrops(climate);

    res.json({
      success: true,
      climate: climate,
      count: suitableCrops.length,
      data: suitableCrops
    });

  } catch (error) {
    console.error('Error finding suitable crops:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding suitable crops',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/crops/top-roi - Get crops with highest ROI
// ============================================================

router.get('/top-roi', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topCrops = await Crop.getHighestROI(limit);

    // Calculate ROI for each
    const cropsWithROI = topCrops.map(crop => {
      const roi = ((crop.potentialRevenue - crop.operatingCost) / crop.initialInvestment) * 100;
      return {
        ...crop.toObject(),
        roi: Math.round(roi * 10) / 10 // Round to 1 decimal
      };
    });

    res.json({
      success: true,
      count: cropsWithROI.length,
      data: cropsWithROI
    });

  } catch (error) {
    console.error('Error fetching top ROI crops:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top ROI crops',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/crops/:id - Get single crop by ID
// ============================================================

router.get('/:id', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Include virtual fields in response
    const cropData = crop.toObject({ virtuals: true });

    // Add 5-year projection
    cropData.fiveYearProjection = crop.calculateFiveYearProjection(1);

    res.json({
      success: true,
      data: cropData
    });

  } catch (error) {
    console.error('Error fetching crop:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching crop',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/crops/:id/projection - Get 5-year projection
// ============================================================

router.get('/:id/projection', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    const landSize = parseFloat(req.query.landSize) || 1;
    const projection = crop.calculateFiveYearProjection(landSize);

    res.json({
      success: true,
      crop: {
        id: crop._id,
        name_en: crop.name_en,
        name_zh: crop.name_zh
      },
      landSize: landSize,
      projection: projection
    });

  } catch (error) {
    console.error('Error calculating projection:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating projection',
      error: error.message
    });
  }
});

module.exports = router;