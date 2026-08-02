/**
 * Crop Model
 * Main crop database with climate requirements and economic data
 * Used for crop recommendation engine and suitability scoring
 */

const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  // ============================================================
  // BASIC INFORMATION
  // ============================================================

  name_en: {
    type: String,
    required: [true, 'English name is required'],
    trim: true,
    maxlength: [100, 'Name must be less than 100 characters']
  },

  name_zh: {
    type: String,
    required: [true, 'Chinese name is required'],
    trim: true,
    maxlength: [100, 'Name must be less than 100 characters']
  },

  imageUrl: {
    type: String,
    trim: true,
    default: function() {
      return `https://placehold.co/400x300/198754/FFFFFF?text=${this.name_en}`;
    }
  },

  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['fruit', 'vegetable', 'specialty', 'grain', 'herb'],
      message: 'Category must be: fruit, vegetable, specialty, grain, or herb'
    }
  },

  // ============================================================
  // CLIMATE REQUIREMENTS
  // ============================================================

  optimalTempMin: {
    type: Number,
    required: [true, 'Minimum optimal temperature is required'],
    min: [-10, 'Temperature must be above -10°C'],
    max: [50, 'Temperature must be below 50°C']
  },

  optimalTempMax: {
    type: Number,
    required: [true, 'Maximum optimal temperature is required'],
    min: [-10, 'Temperature must be above -10°C'],
    max: [50, 'Temperature must be below 50°C'],
    validate: {
      validator: function(value) { return value > this.optimalTempMin; },
      message: 'Max temperature must be greater than min temperature'
    }
  },

  minRainfall: {
    type: Number,
    required: [true, 'Minimum rainfall is required'],
    min: [0, 'Rainfall cannot be negative'],
    max: [10000, 'Rainfall must be below 10,000mm']
  },

  maxRainfall: {
    type: Number,
    required: [true, 'Maximum rainfall is required'],
    min: [0, 'Rainfall cannot be negative'],
    max: [10000, 'Rainfall must be below 10,000mm'],
    validate: {
      validator: function(value) { return value > this.minRainfall; },
      message: 'Max rainfall must be greater than min rainfall'
    }
  },

  minElevation: {
    type: Number,
    required: [true, 'Minimum elevation is required'],
    min: [0, 'Elevation cannot be negative'],
    max: [4000, 'Elevation must be below 4000m']
  },

  maxElevation: {
    type: Number,
    required: [true, 'Maximum elevation is required'],
    min: [0, 'Elevation cannot be negative'],
    max: [4000, 'Elevation must be below 4000m'],
    validate: {
      validator: function(value) { return value > this.minElevation; },
      message: 'Max elevation must be greater than min elevation'
    }
  },

  // ============================================================
  // GROWING INFORMATION
  // ============================================================

  growingSeason: {
    type: Number,
    required: [true, 'Growing season length is required'],
    min: [1, 'Growing season must be at least 1 day'],
    max: [3650, 'Growing season must be less than 10 years (3650 days)']
  },

  difficultyLevel: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: {
      values: ['easy', 'moderate', 'hard'],
      message: 'Difficulty must be: easy, moderate, or hard'
    },
    default: 'moderate'
  },

  // ============================================================
  // ECONOMIC DATA
  // ============================================================

  expectedYield: {
    type: Number,
    required: [true, 'Expected yield is required'],
    min: [1, 'Yield must be positive'],
    max: [100000, 'Yield must be below 100,000 kg/ha']
  },

  marketPriceMin: {
    type: Number,
    required: [true, 'Minimum market price is required'],
    min: [0, 'Price cannot be negative'],
    max: [10000, 'Price must be below NT$10,000/kg']
  },

  marketPriceMax: {
    type: Number,
    required: [true, 'Maximum market price is required'],
    min: [0, 'Price cannot be negative'],
    max: [10000, 'Price must be below NT$10,000/kg'],
    validate: {
      validator: function(value) { return value >= this.marketPriceMin; },
      message: 'Max price must be greater than or equal to min price'
    }
  },

  laborHours: {
    type: Number,
    required: [true, 'Labor hours are required'],
    min: [0, 'Labor hours cannot be negative'],
    max: [5000, 'Labor hours must be below 5,000 hours/ha/year']
  },

  initialInvestment: {
    type: Number,
    required: [true, 'Initial investment is required'],
    min: [0, 'Investment cannot be negative'],
    max: [10000000, 'Investment must be below NT$10,000,000/ha']
  },

  operatingCost: {
    type: Number,
    required: [true, 'Annual operating cost is required'],
    min: [0, 'Operating cost cannot be negative'],
    max: [1000000, 'Operating cost must be below NT$1,000,000/ha/year']
  },

  breakEvenMonths: {
    type: Number,
    required: [true, 'Break-even timeline is required'],
    min: [1, 'Break-even must be at least 1 month'],
    max: [120, 'Break-even must be less than 10 years (120 months)']
  },

  // ============================================================
  // GROWTH TIMELINE
  // ============================================================
 
  plantingSeasons: {
    type: [String],
    default: [],
    // e.g. ['Spring', 'Autumn'] or ['March-April', 'September-October']
  },
 
  daysToMaturity: {
    type: Number,
    min: [1, 'Days to maturity must be positive'],
    max: [3650, 'Days to maturity must be less than 10 years']
  },
 
  harvestSeasons: {
    type: [String],
    default: [],
    // e.g. ['Summer', 'Winter'] or ['June-August']
  },
 
  yieldPeriod: {
    type: String,
    trim: true,
    maxlength: [100, 'Yield period must be less than 100 characters']
    // e.g. 'Annual' or 'Perennial (15-20 years)' or 'Year-round'
  },
 
  // ============================================================
  // ADDITIONAL AGRONOMY (for detail page)
  // ============================================================
 
  bestPractices: {
    type: [String],
    default: []
  },
 
  commonPests: [{
    name:       { type: String, trim: true },
    management: { type: String, trim: true }
  }],
 
  soilPH: {
    min: { type: Number },
    max: { type: Number }
  },

  // ============================================================
  // MARKET DEMAND
  // ============================================================

  marketDemandIndex: {
    type: Number,
    required: [true, 'Market demand index is required'],
    min: [0, 'Demand index must be between 0-100'],
    max: [100, 'Demand index must be between 0-100'],
    default: 75
  }

}, {
  timestamps: true,
  collection: 'crops'
});

// ============================================================
// INDEXES — single declarations, no duplicates
// ============================================================

cropSchema.index({ category: 1 });
cropSchema.index({ name_en: 'text', name_zh: 'text' });
cropSchema.index({ optimalTempMin: 1, optimalTempMax: 1, minElevation: 1, maxElevation: 1 });
cropSchema.index({ difficultyLevel: 1 });

// ============================================================
// VIRTUAL FIELDS
// ============================================================

cropSchema.virtual('avgMarketPrice').get(function() {
  return (this.marketPriceMin + this.marketPriceMax) / 2;
});

cropSchema.virtual('potentialRevenue').get(function() {
  return this.expectedYield * this.avgMarketPrice;
});

cropSchema.virtual('annualProfit').get(function() {
  return this.potentialRevenue - this.operatingCost;
});

cropSchema.virtual('tempRange').get(function() {
  return `${this.optimalTempMin}°C - ${this.optimalTempMax}°C`;
});

cropSchema.virtual('pricePerKg').get(function() {
  return Math.round((this.marketPriceMin + this.marketPriceMax) / 2);
});

cropSchema.virtual('roiPercentage').get(function() {
  const revenue = this.expectedYield * this.avgMarketPrice;
  const profit  = revenue - this.operatingCost;
  return Math.round((profit / this.initialInvestment) * 100);
});

cropSchema.virtual('rainfallRange').get(function() {
  return `${this.minRainfall}mm - ${this.maxRainfall}mm`;
});

cropSchema.virtual('elevationRange').get(function() {
  return `${this.minElevation}m - ${this.maxElevation}m`;
});

cropSchema.virtual('difficultyEmoji').get(function() {
  const map = { easy: '🟢', moderate: '🟡', hard: '🔴' };
  return map[this.difficultyLevel] || '⚪';
});

// ============================================================
// INSTANCE METHODS
// ============================================================

cropSchema.methods.isSuitableFor = function(climate) {
  const tempOk = climate.avgTemp >= this.optimalTempMin && climate.avgTemp <= this.optimalTempMax;
  const rainOk = climate.annualRainfall >= this.minRainfall && climate.annualRainfall <= this.maxRainfall;
  const elevOk = climate.elevation >= this.minElevation && climate.elevation <= this.maxElevation;
  return tempOk && rainOk && elevOk;
};

cropSchema.methods.calculateFiveYearProjection = function(landSize = 1) {
  const years = [];
  const monthsToFirstHarvest = Math.ceil(this.growingSeason / 30);
  for (let year = 1; year <= 5; year++) {
    const monthsInYear    = year === 1 ? (12 - monthsToFirstHarvest) : 12;
    const harvestsPerYear = Math.floor(monthsInYear / (this.growingSeason / 30));
    const revenue         = harvestsPerYear * this.expectedYield * this.avgMarketPrice * landSize;
    const costs           = this.operatingCost * landSize;
    const profit          = revenue - costs;
    const netProfit       = year === 1 ? profit - (this.initialInvestment * landSize) : profit;
    years.push({ year, revenue: Math.round(revenue), costs: Math.round(costs), profit: Math.round(netProfit) });
  }
  return {
    years,
    totalRevenue: years.reduce((sum, y) => sum + y.revenue, 0),
    totalProfit:  years.reduce((sum, y) => sum + y.profit, 0)
  };
};

// ============================================================
// STATIC METHODS
// ============================================================

cropSchema.statics.findSuitableCrops = async function(climate) {
  return this.find({
    optimalTempMin: { $lte: climate.avgTemp },
    optimalTempMax: { $gte: climate.avgTemp },
    minRainfall:    { $lte: climate.annualRainfall },
    maxRainfall:    { $gte: climate.annualRainfall },
    minElevation:   { $lte: climate.elevation },
    maxElevation:   { $gte: climate.elevation }
  });
};

cropSchema.statics.findByCategory = async function(category) {
  return this.find({ category }).sort({ name_en: 1 });
};

cropSchema.statics.findByDifficulty = async function(difficulty) {
  return this.find({ difficultyLevel: difficulty }).sort({ name_en: 1 });
};

cropSchema.statics.getHighestROI = async function(limit = 10) {
  const crops = await this.find({});
  const cropsWithROI = crops.map(crop => {
    const roi = ((crop.potentialRevenue - crop.operatingCost) / crop.initialInvestment) * 100;
    return { crop, roi };
  });
  return cropsWithROI.sort((a, b) => b.roi - a.roi).slice(0, limit).map(i => i.crop);
};

// ============================================================
// PRE-SAVE MIDDLEWARE
// ============================================================

cropSchema.pre('save', function(next) {
  if (this.optimalTempMax <= this.optimalTempMin)
    return next(new Error('optimalTempMax must be greater than optimalTempMin'));
  if (this.maxRainfall <= this.minRainfall)
    return next(new Error('maxRainfall must be greater than minRainfall'));
  if (this.maxElevation <= this.minElevation)
    return next(new Error('maxElevation must be greater than minElevation'));
  next();
});

cropSchema.set('toObject', { virtuals: true });
cropSchema.set('toJSON',   { virtuals: true });

module.exports = mongoose.model('Crop', cropSchema);