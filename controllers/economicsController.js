/**
 * Economics Controller
 * Handles 5-year profit projections and ROI calculations
 */

const Crop = require('../models/Crop');
const CoffeeVariety = require('../models/CoffeeVariety');

// Show economics calculator page
const showEconomicsPage = async (req, res) => {
  try {
    const cropId = req.query.crop;
    const coffeeId = req.query.coffee;
    const landSize = parseFloat(req.query.landSize) || 1;

    let selectedCrop = null;
    let projection = null;
    let isCalculated = false;

    // If crop ID provided, calculate projection
    if (cropId) {
      selectedCrop = await Crop.findById(cropId);
      if (selectedCrop) {
        projection = calculateCropProjection(selectedCrop, landSize);
        isCalculated = true;
      }
    } else if (coffeeId) {
      selectedCrop = await CoffeeVariety.findById(coffeeId);
      if (selectedCrop) {
        projection = calculateCoffeeProjection(selectedCrop, landSize);
        isCalculated = true;
      }
    }

    // Get all crops for dropdown
    const allCrops = await Crop.find({}).sort({ name_en: 1 });
    const allCoffee = await CoffeeVariety.find({}).sort({ varietyName: 1 });

    res.render('economics', {
      title: 'Economics Calculator',
      page: 'economics',
      selectedCrop,
      projection,
      isCalculated,
      landSize,
      allCrops,
      allCoffee
    });

  } catch (error) {
    console.error('Error rendering economics page:', error);
    res.status(500).render('error', {
      title: 'Error',
      page: 'error',
      message: 'Failed to load economics calculator',
      error: { status: 500, stack: error.stack }
    });
  }
};

// Calculate 5-year projection for regular crops
function calculateCropProjection(crop, landSize) {
  const years = [];
  const growingSeasonMonths = Math.ceil(crop.growingSeason / 30);
  const avgPrice = (crop.marketPriceMin + crop.marketPriceMax) / 2;

  let cumulativeProfit = 0;

  for (let year = 1; year <= 5; year++) {
    // First year: Account for growing season delay
    const effectiveMonths = year === 1 ? Math.max(0, 12 - growingSeasonMonths) : 12;
    const harvestsPerYear = Math.floor(effectiveMonths / growingSeasonMonths);
    
    // Revenue
    const revenue = harvestsPerYear * crop.expectedYield * avgPrice * landSize;
    
    // Costs
    const operatingCost = crop.operatingCost * landSize;
    const investmentCost = year === 1 ? crop.initialInvestment * landSize : 0;
    const totalCosts = operatingCost + investmentCost;
    
    // Profit
    const annualProfit = revenue - totalCosts;
    cumulativeProfit += annualProfit;

    years.push({
      year,
      revenue: Math.round(revenue),
      operatingCost: Math.round(operatingCost),
      investmentCost: Math.round(investmentCost),
      totalCosts: Math.round(totalCosts),
      annualProfit: Math.round(annualProfit),
      cumulativeProfit: Math.round(cumulativeProfit)
    });
  }

  // Calculate totals and metrics
  const totalRevenue = years.reduce((sum, y) => sum + y.revenue, 0);
  const totalCosts = years.reduce((sum, y) => sum + y.totalCosts, 0);
  const totalProfit = totalRevenue - totalCosts;
  const roi = ((totalProfit / (crop.initialInvestment * landSize)) * 100).toFixed(1);
  
  // Find break-even point
  let breakEvenYear = null;
  for (let i = 0; i < years.length; i++) {
    if (years[i].cumulativeProfit > 0) {
      breakEvenYear = years[i].year;
      break;
    }
  }

  return {
    years,
    summary: {
      totalRevenue: Math.round(totalRevenue),
      totalCosts: Math.round(totalCosts),
      totalProfit: Math.round(totalProfit),
      roi: parseFloat(roi),
      breakEvenYear: breakEvenYear || 'Not within 5 years',
      avgAnnualProfit: Math.round(totalProfit / 5),
      avgPrice
    },
    cropInfo: {
      name: crop.name_en,
      nameZh: crop.name_zh,
      category: crop.category,
      yieldPerHa: crop.expectedYield,
      priceRange: `NT$${crop.marketPriceMin}-${crop.marketPriceMax}`,
      difficulty: crop.difficultyLevel
    }
  };
}

// Calculate 5-year projection for coffee
function calculateCoffeeProjection(coffee, landSize) {
  const years = [];
  const avgPrice = 600; // Default coffee price
  const treesTotal = coffee.treesPerHectare * landSize;
  
  let cumulativeProfit = 0;

  for (let year = 1; year <= 5; year++) {
    // Coffee takes 3 years to first harvest
    let yieldPerTree = 0;
    if (year >= coffee.yearsToFirstHarvest) {
      yieldPerTree = coffee.yieldPerTree;
    }
    
    // Revenue
    const revenue = treesTotal * yieldPerTree * avgPrice;
    
    // Costs
    const operatingCost = 80000 * landSize; // Default operating cost
    const investmentCost = year === 1 ? 200000 * landSize : 0;
    const totalCosts = operatingCost + investmentCost;
    
    // Profit
    const annualProfit = revenue - totalCosts;
    cumulativeProfit += annualProfit;

    years.push({
      year,
      revenue: Math.round(revenue),
      operatingCost: Math.round(operatingCost),
      investmentCost: Math.round(investmentCost),
      totalCosts: Math.round(totalCosts),
      annualProfit: Math.round(annualProfit),
      cumulativeProfit: Math.round(cumulativeProfit)
    });
  }

  const totalRevenue = years.reduce((sum, y) => sum + y.revenue, 0);
  const totalCosts = years.reduce((sum, y) => sum + y.totalCosts, 0);
  const totalProfit = totalRevenue - totalCosts;
  const roi = ((totalProfit / (200000 * landSize)) * 100).toFixed(1);
  
  let breakEvenYear = null;
  for (let i = 0; i < years.length; i++) {
    if (years[i].cumulativeProfit > 0) {
      breakEvenYear = years[i].year;
      break;
    }
  }

  return {
    years,
    summary: {
      totalRevenue: Math.round(totalRevenue),
      totalCosts: Math.round(totalCosts),
      totalProfit: Math.round(totalProfit),
      roi: parseFloat(roi),
      breakEvenYear: breakEvenYear || 'Not within 5 years',
      avgAnnualProfit: Math.round(totalProfit / 5),
      avgPrice
    },
    cropInfo: {
      name: coffee.varietyName,
      nameZh: coffee.varietyName_zh,
      category: 'Coffee',
      yieldPerHa: treesTotal * coffee.yieldPerTree,
      priceRange: `NT$400-800`,
      difficulty: 'hard'
    }
  };
}

module.exports = {
  showEconomicsPage
};