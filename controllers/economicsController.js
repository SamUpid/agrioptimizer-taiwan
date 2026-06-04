/**
 * Economics Controller
 * Personalised 5-year profit projections for saved crops and coffees
 *
 * Logged-in users: see projections for their saved crops/coffees only
 * Guest users: see dropdown to pick any crop
 */

const Crop          = require('../models/Crop');
const CoffeeVariety = require('../models/CoffeeVariety');
const FarmProfile   = require('../models/FarmProfile');
const mongoose      = require('mongoose');

// ── HELPER: find FarmProfile with dual userId lookup ──────────
async function findFarmProfile(userId) {
  let profile = await FarmProfile.findOne({ userId });
  if (!profile && mongoose.isValidObjectId(userId)) {
    profile = await FarmProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId)
    });
  }
  return profile;
}

// ── HELPER: 5-year projection for a crop ─────────────────────
function calculateCropProjection(crop, landSize) {
  const years = [];
  const growingSeasonMonths = Math.ceil((crop.growingSeason || 90) / 30);
  const avgPrice = ((crop.marketPriceMin || 50) + (crop.marketPriceMax || 100)) / 2;
  let cumulativeProfit = 0;

  for (let year = 1; year <= 5; year++) {
    const effectiveMonths  = year === 1
      ? Math.max(0, 12 - growingSeasonMonths)
      : 12;
    const harvestsPerYear  = Math.max(1, Math.floor(effectiveMonths / growingSeasonMonths));
    const revenue          = harvestsPerYear * (crop.expectedYield || 5000) * avgPrice * landSize;
    const operatingCost    = (crop.operatingCost  || 40000) * landSize;
    const investmentCost   = year === 1 ? (crop.initialInvestment || 80000) * landSize : 0;
    const totalCosts       = operatingCost + investmentCost;
    const annualProfit     = revenue - totalCosts;
    cumulativeProfit      += annualProfit;

    years.push({
      year,
      revenue:          Math.round(revenue),
      operatingCost:    Math.round(operatingCost),
      investmentCost:   Math.round(investmentCost),
      totalCosts:       Math.round(totalCosts),
      annualProfit:     Math.round(annualProfit),
      cumulativeProfit: Math.round(cumulativeProfit)
    });
  }

  const totalRevenue = years.reduce((s, y) => s + y.revenue, 0);
  const totalCosts   = years.reduce((s, y) => s + y.totalCosts, 0);
  const totalProfit  = totalRevenue - totalCosts;
  const initInvest   = (crop.initialInvestment || 80000) * landSize;
  const roi          = initInvest > 0
    ? ((totalProfit / initInvest) * 100).toFixed(1)
    : '0.0';

  let breakEvenYear = null;
  for (const y of years) {
    if (y.cumulativeProfit > 0) { breakEvenYear = y.year; break; }
  }

  return {
    years,
    summary: {
      totalRevenue:    Math.round(totalRevenue),
      totalCosts:      Math.round(totalCosts),
      totalProfit:     Math.round(totalProfit),
      roi:             parseFloat(roi),
      breakEvenYear:   breakEvenYear || 'Beyond 5 years',
      avgAnnualProfit: Math.round(totalProfit / 5),
      avgPrice
    },
    cropInfo: {
      name:       crop.name_en || crop.cropName,
      nameZh:     crop.name_zh || crop.cropNameZh,
      imageUrl:   crop.imageUrl || '',
      category:   crop.category || 'crop',
      yieldPerHa: crop.expectedYield || 0,
      priceRange: `NT$${crop.marketPriceMin || 0}–${crop.marketPriceMax || 0}/kg`,
      difficulty: crop.difficultyLevel || 'moderate',
      breakEvenMonths: crop.breakEvenMonths || null,
      marketDemandIndex: crop.marketDemandIndex || null
    }
  };
}

// ── HELPER: 5-year projection for a coffee variety ────────────
function calculateCoffeeProjection(coffee, landSize) {
  const years      = [];
  const avgPrice   = 600;
  const treesTotal = (coffee.treesPerHectare || 1200) * landSize;
  let cumulativeProfit = 0;

  for (let year = 1; year <= 5; year++) {
    const yieldPerTree   = year >= (coffee.yearsToFirstHarvest || 3)
      ? (coffee.yieldPerTree || 1.5)
      : 0;
    const revenue        = treesTotal * yieldPerTree * avgPrice;
    const operatingCost  = 80000 * landSize;
    const investmentCost = year === 1 ? 200000 * landSize : 0;
    const totalCosts     = operatingCost + investmentCost;
    const annualProfit   = revenue - totalCosts;
    cumulativeProfit    += annualProfit;

    years.push({
      year,
      revenue:          Math.round(revenue),
      operatingCost:    Math.round(operatingCost),
      investmentCost:   Math.round(investmentCost),
      totalCosts:       Math.round(totalCosts),
      annualProfit:     Math.round(annualProfit),
      cumulativeProfit: Math.round(cumulativeProfit)
    });
  }

  const totalRevenue = years.reduce((s, y) => s + y.revenue, 0);
  const totalCosts   = years.reduce((s, y) => s + y.totalCosts, 0);
  const totalProfit  = totalRevenue - totalCosts;
  const initInvest   = 200000 * landSize;
  const roi          = ((totalProfit / initInvest) * 100).toFixed(1);

  let breakEvenYear = null;
  for (const y of years) {
    if (y.cumulativeProfit > 0) { breakEvenYear = y.year; break; }
  }

  return {
    years,
    summary: {
      totalRevenue:    Math.round(totalRevenue),
      totalCosts:      Math.round(totalCosts),
      totalProfit:     Math.round(totalProfit),
      roi:             parseFloat(roi),
      breakEvenYear:   breakEvenYear || 'Beyond 5 years',
      avgAnnualProfit: Math.round(totalProfit / 5),
      avgPrice
    },
    cropInfo: {
      name:       coffee.varietyName || coffee.coffeeName,
      nameZh:     coffee.varietyName_zh || coffee.coffeeNameZh,
      imageUrl:   coffee.imageUrl || '',
      category:   'Coffee',
      yieldPerHa: treesTotal * (coffee.yieldPerTree || 1.5),
      priceRange: 'NT$400–800/kg',
      difficulty: 'hard',
      cupQuality: coffee.cupQualityMin && coffee.cupQualityMax
        ? `${coffee.cupQualityMin}–${coffee.cupQualityMax} SCAA`
        : null,
      yearsToHarvest: coffee.yearsToFirstHarvest || 3
    }
  };
}

// ============================================================
// GET /economics — Main economics page
// ============================================================
const showEconomicsPage = async (req, res) => {
  try {
    const landSize    = parseFloat(req.query.landSize) || 1;
    const cropId      = req.query.crop;
    const coffeeId    = req.query.coffee;
    const isLoggedIn  = !!req.session.user;

    let farmProfile       = null;
    let savedCrops        = [];
    let savedCoffees      = [];
    let selectedCrop      = null;
    let projection        = null;
    let isCalculated      = false;
    let projectionType    = null; // 'crop' | 'coffee'

    // ── Load saved crops/coffees for logged-in users ──────────
    if (isLoggedIn) {
      farmProfile  = await findFarmProfile(req.session.user._id);
      savedCrops   = farmProfile?.crops   || [];
      savedCoffees = farmProfile?.coffees || [];
    }

    // ── Calculate projection if requested ────────────────────
    if (cropId) {
      // Try DB first, then match from saved crops by name
      selectedCrop = await Crop.findById(cropId).lean().catch(() => null);

      if (!selectedCrop && savedCrops.length) {
        // Guest or ID mismatch — build minimal crop from saved name
        const saved = savedCrops.find(c => c._id?.toString() === cropId);
        if (saved) selectedCrop = saved;
      }

      if (selectedCrop) {
        projection     = calculateCropProjection(selectedCrop, landSize);
        isCalculated   = true;
        projectionType = 'crop';
      }

    } else if (coffeeId) {
      selectedCrop = await CoffeeVariety.findById(coffeeId).lean().catch(() => null);

      if (!selectedCrop && savedCoffees.length) {
        const saved = savedCoffees.find(c => c._id?.toString() === coffeeId);
        if (saved) selectedCrop = saved;
      }

      if (selectedCrop) {
        projection     = calculateCoffeeProjection(selectedCrop, landSize);
        isCalculated   = true;
        projectionType = 'coffee';
      }

    } else if (isLoggedIn && savedCrops.length > 0) {
      // Auto-show first saved crop projection on first visit
      const firstSaved = savedCrops[0];
      const dbCrop = await Crop.findOne({
        name_en: { $regex: firstSaved.cropName, $options: 'i' }
      }).lean().catch(() => null);

      if (dbCrop) {
        selectedCrop   = { ...dbCrop, imageUrl: firstSaved.imageUrl || dbCrop.imageUrl };
        projection     = calculateCropProjection(selectedCrop, landSize);
        isCalculated   = true;
        projectionType = 'crop';
      }
    }

    // ── Enrich saved crops with DB data for projections ──────
    // Match saved crop names to DB records for full economics data
    const enrichedSavedCrops = await Promise.all(
      savedCrops.map(async saved => {
        const db = await Crop.findOne({
          name_en: { $regex: saved.cropName.split(' ')[0], $options: 'i' }
        }).lean().catch(() => null);
        return {
          ...saved,
          _id:              db?._id || saved._id,
          marketPriceMin:   db?.marketPriceMin,
          marketPriceMax:   db?.marketPriceMax,
          expectedYield:    db?.expectedYield,
          breakEvenMonths:  db?.breakEvenMonths,
          initialInvestment: db?.initialInvestment,
          operatingCost:    db?.operatingCost,
          difficultyLevel:  db?.difficultyLevel,
          marketDemandIndex: db?.marketDemandIndex,
          imageUrl:         saved.imageUrl || db?.imageUrl
        };
      })
    );

    const enrichedSavedCoffees = await Promise.all(
      savedCoffees.map(async saved => {
        const db = await CoffeeVariety.findOne({
          varietyName: { $regex: saved.variety || saved.coffeeName.split(' ')[0], $options: 'i' }
        }).lean().catch(() => null);
        return {
          ...saved,
          _id:               db?._id || saved._id,
          yieldPerTree:      db?.yieldPerTree,
          treesPerHectare:   db?.treesPerHectare,
          yearsToFirstHarvest: db?.yearsToFirstHarvest,
          cupQualityMin:     db?.cupQualityMin,
          cupQualityMax:     db?.cupQualityMax,
          imageUrl:          saved.imageUrl || db?.imageUrl
        };
      })
    );

    // ── Guest: load all crops for dropdown ────────────────────
    let allCrops  = [];
    let allCoffee = [];
    if (!isLoggedIn) {
      allCrops  = await Crop.find({}).sort({ name_en: 1 }).lean();
      allCoffee = await CoffeeVariety.find({}).sort({ varietyName: 1 }).lean();
    }

    res.render('economics', {
      title:      'Farm Economics | 農場經濟',
      page:       'economics',
      isLoggedIn,
      farmProfile,
      savedCrops:   enrichedSavedCrops,
      savedCoffees: enrichedSavedCoffees,
      selectedCrop,
      projection,
      isCalculated,
      projectionType,
      landSize,
      allCrops,
      allCoffee,
      elevation:    farmProfile?.location?.elevation || req.session.location?.elevation || null,
      queryCropId:  req.query.crop   || null,
      queryCoffeeId: req.query.coffee || null
    });

  } catch (error) {
    console.error('Economics error:', error);
    res.status(500).render('error', {
      title:   'Error',
      page:    'error',
      message: 'Failed to load economics page',
      error:   { status: 500, stack: error.stack }
    });
  }
};

module.exports = { showEconomicsPage };