/**
 * Coffee API Routes
 * Handles all coffee variety endpoints
 */

const express = require('express');
const router = express.Router();
const CoffeeVariety = require('../models/CoffeeVariety');

// ============================================================
// GET /api/coffee - Get all coffee varieties
// ============================================================

/**
 * Query parameters:
 * - diseaseResistance: Filter by resistance (low, medium, high)
 * - minQuality: Minimum cup quality score
 * - sort: Sort field (name, quality, yield, elevation)
 * - order: Sort order (asc, desc)
 */
router.get('/', async (req, res) => {
  try {
    const {
      diseaseResistance,
      minQuality,
      sort = 'varietyName',
      order = 'asc'
    } = req.query;

    // Build query
    const query = {};

    if (diseaseResistance) {
      query.diseaseResistance = diseaseResistance;
    }

    if (minQuality) {
      query.cupQualityMin = { $gte: parseFloat(minQuality) };
    }

    // Build sort object
    const sortObj = {};
    if (sort === 'quality') {
      sortObj.cupQualityMax = order === 'asc' ? 1 : -1;
    } else if (sort === 'yield') {
      sortObj.yieldPerTree = order === 'asc' ? 1 : -1;
    } else if (sort === 'elevation') {
      sortObj.optimalElevationMin = order === 'asc' ? 1 : -1;
    } else {
      sortObj[sort] = order === 'asc' ? 1 : -1;
    }

    // Execute query
    const varieties = await CoffeeVariety.find(query).sort(sortObj);

    // Calculate summary
    const avgQuality = varieties.length > 0
      ? varieties.reduce((sum, v) => sum + v.avgCupQuality, 0) / varieties.length
      : 0;

    res.json({
      success: true,
      count: varieties.length,
      avgQuality: Math.round(avgQuality * 10) / 10,
      data: varieties
    });

  } catch (error) {
    console.error('Error fetching coffee varieties:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coffee varieties',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/coffee/for-elevation - Find varieties for elevation
// ============================================================

/**
 * Query parameters:
 * - elevation: Elevation in meters (required)
 * - tolerance: Tolerance in meters (default: 100)
 */
router.get('/for-elevation', async (req, res) => {
  try {
    const { elevation, tolerance } = req.query;

    if (!elevation) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: elevation'
      });
    }

    const elev = parseFloat(elevation);
    const tol = tolerance ? parseFloat(tolerance) : 100;

    const varieties = await CoffeeVariety.findByElevation(elev, tol);

    res.json({
      success: true,
      elevation: elev,
      tolerance: tol,
      count: varieties.length,
      data: varieties
    });

  } catch (error) {
    console.error('Error finding varieties by elevation:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding varieties by elevation',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/coffee/taiwan-suitable - Get Taiwan mountain varieties
// ============================================================

router.get('/taiwan-suitable', async (req, res) => {
  try {
    const varieties = await CoffeeVariety.findForTaiwanMountains();

    res.json({
      success: true,
      elevationRange: '800-1500m',
      count: varieties.length,
      data: varieties
    });

  } catch (error) {
    console.error('Error fetching Taiwan suitable varieties:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Taiwan suitable varieties',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/coffee/disease-resistant - Get disease resistant varieties
// ============================================================

router.get('/disease-resistant', async (req, res) => {
  try {
    const varieties = await CoffeeVariety.findDiseaseResistant();

    res.json({
      success: true,
      count: varieties.length,
      data: varieties
    });

  } catch (error) {
    console.error('Error fetching disease resistant varieties:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching disease resistant varieties',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/coffee/high-quality - Get high quality varieties
// ============================================================

/**
 * Query parameters:
 * - minQuality: Minimum SCAA score (default: 80)
 */
router.get('/high-quality', async (req, res) => {
  try {
    const minQuality = parseFloat(req.query.minQuality) || 80;
    const varieties = await CoffeeVariety.findByQuality(minQuality);

    res.json({
      success: true,
      minQuality: minQuality,
      count: varieties.length,
      data: varieties
    });

  } catch (error) {
    console.error('Error fetching high quality varieties:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching high quality varieties',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/coffee/:id - Get single variety by ID
// ============================================================

router.get('/:id', async (req, res) => {
  try {
    const variety = await CoffeeVariety.findById(req.params.id);

    if (!variety) {
      return res.status(404).json({
        success: false,
        message: 'Coffee variety not found'
      });
    }

    // Include virtual fields
    const varietyData = variety.toObject({ virtuals: true });

    // Add income projections at different price points
    varietyData.incomeProjections = [
      {
        pricePerKg: 400,
        annualIncome: variety.calculateAnnualIncome(400)
      },
      {
        pricePerKg: 600,
        annualIncome: variety.calculateAnnualIncome(600)
      },
      {
        pricePerKg: 800,
        annualIncome: variety.calculateAnnualIncome(800)
      }
    ];

    res.json({
      success: true,
      data: varietyData
    });

  } catch (error) {
    console.error('Error fetching coffee variety:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coffee variety',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/coffee/:id/income - Calculate income projection
// ============================================================

/**
 * Query parameters:
 * - pricePerKg: Market price in NT$/kg (default: 600)
 * - landSize: Land size in hectares (default: 1)
 */
router.get('/:id/income', async (req, res) => {
  try {
    const variety = await CoffeeVariety.findById(req.params.id);

    if (!variety) {
      return res.status(404).json({
        success: false,
        message: 'Coffee variety not found'
      });
    }

    const pricePerKg = parseFloat(req.query.pricePerKg) || 600;
    const landSize = parseFloat(req.query.landSize) || 1;

    const annualIncomePerHa = variety.calculateAnnualIncome(pricePerKg);
    const totalAnnualIncome = annualIncomePerHa * landSize;

    // Calculate 5-year projection
    const projection = {
      variety: {
        name: variety.varietyName,
        yieldPerTree: variety.yieldPerTree,
        treesPerHectare: variety.treesPerHectare
      },
      assumptions: {
        pricePerKg: pricePerKg,
        landSize: landSize
      },
      years: []
    };

    for (let year = 1; year <= 5; year++) {
      let income = 0;
      if (year >= variety.yearsToFirstHarvest) {
        income = totalAnnualIncome;
      }
      projection.years.push({
        year,
        income: Math.round(income),
        cumulative: Math.round(projection.years.reduce((sum, y) => sum + y.income, 0) + income)
      });
    }

    res.json({
      success: true,
      data: projection
    });

  } catch (error) {
    console.error('Error calculating income:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating income',
      error: error.message
    });
  }
});

// ============================================================
// GET /api/coffee/compare - Compare multiple varieties
// ============================================================

/**
 * Query parameters:
 * - ids: Comma-separated variety IDs (e.g., "id1,id2,id3")
 * - pricePerKg: Price for comparison (default: 600)
 */
router.get('/compare/varieties', async (req, res) => {
  try {
    const { ids, pricePerKg = 600 } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: ids'
      });
    }

    const varietyIds = ids.split(',');
    const price = parseFloat(pricePerKg);

    const varieties = await CoffeeVariety.find({
      _id: { $in: varietyIds }
    });

    if (varieties.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No varieties found with provided IDs'
      });
    }

    // Compare varieties
    const comparison = varieties.map(v => ({
      id: v._id,
      name: v.varietyName,
      elevationRange: v.elevationRange,
      avgCupQuality: v.avgCupQuality,
      qualityGrade: v.qualityGrade,
      diseaseResistance: v.diseaseResistance,
      yieldPerHectare: v.yieldPerHectare,
      annualIncome: v.calculateAnnualIncome(price),
      yearsToFirstHarvest: v.yearsToFirstHarvest,
      difficultyLevel: v.diseaseResistance === 'high' ? 'moderate' : 
                        v.diseaseResistance === 'medium' ? 'moderate' : 'hard'
    }));

    // Sort by cup quality
    comparison.sort((a, b) => b.avgCupQuality - a.avgCupQuality);

    res.json({
      success: true,
      pricePerKg: price,
      count: comparison.length,
      data: comparison
    });

  } catch (error) {
    console.error('Error comparing varieties:', error);
    res.status(500).json({
      success: false,
      message: 'Error comparing varieties',
      error: error.message
    });
  }
});

module.exports = router;