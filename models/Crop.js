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
    maxlength: [100, 'Name must be less than 100 characters'],
    index: true
  },
  
  name_zh: {
    type: String,
    required: [true, 'Chinese name is required'],
    trim: true,
    maxlength: [100, 'Name must be less than 100 characters'],
    index: true
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
    },
    index: true
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
      validator: function(value) {
        return value > this.optimalTempMin;
      },
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
      validator: function(value) {
        return value > this.minRainfall;
      },
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
      validator: function(value) {
        return value > this.minElevation;
      },
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
      validator: function(value) {
        return value >= this.marketPriceMin;
      },
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
  // MARKET DEMAND (for suitability algorithm)
  // ============================================================
  
  marketDemandIndex: {
    type: Number,
    required: [true, 'Market demand index is required'],
    min: [0, 'Demand index must be between 0-100'],
    max: [100, 'Demand index must be between 0-100'],
    default: 75 // Default to moderate-high demand
  }
  
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'crops'
});

// ============================================================
// INDEXES
// ============================================================

// Index for category filtering
cropSchema.index({ category: 1 });

// Index for name search (both English and Chinese)
cropSchema.index({ name_en: 'text', name_zh: 'text' });

// Compound index for climate-based queries
cropSchema.index({ 
  optimalTempMin: 1, 
  optimalTempMax: 1, 
  minElevation: 1, 
  maxElevation: 1 
});

// Index for difficulty filtering
cropSchema.index({ difficultyLevel: 1 });

// ============================================================
// VIRTUAL FIELDS
// ============================================================

/**
 * Calculate average market price
 */
cropSchema.virtual('avgMarketPrice').get(function() {
  return (this.marketPriceMin + this.marketPriceMax) / 2;
});

/**
 * Calculate potential annual revenue (at average price)
 * Revenue = Yield × Average Price
 */
cropSchema.virtual('potentialRevenue').get(function() {
  return this.expectedYield * this.avgMarketPrice;
});

/**
 * Calculate annual net profit (at average price)
 * Profit = Revenue - Operating Cost
 */
cropSchema.virtual('annualProfit').get(function() {
  return this.potentialRevenue - this.operatingCost;
});

/**
 * Calculate optimal temperature range as string
 */
cropSchema.virtual('tempRange').get(function() {
  return `${this.optimalTempMin}°C - ${this.optimalTempMax}°C`;
});
/**
 * Calculate average price per kg (for UI display)
 */
cropSchema.virtual('pricePerKg').get(function() {
  return Math.round((this.marketPriceMin + this.marketPriceMax) / 2);
});


/**
 * Calculate ROI percentage (for UI display)
 */
cropSchema.virtual('roiPercentage').get(function() {
  const revenue = this.expectedYield * this.avgMarketPrice;
  const profit = revenue - this.operatingCost;
  const roi = (profit / this.initialInvestment) * 100;
  return Math.round(roi);
});

/**
 * Calculate optimal rainfall range as string
 */
cropSchema.virtual('rainfallRange').get(function() {
  return `${this.minRainfall}mm - ${this.maxRainfall}mm`;
});

/**
 * Calculate elevation range as string
 */
cropSchema.virtual('elevationRange').get(function() {
  return `${this.minElevation}m - ${this.maxElevation}m`;
});

/**
 * Get difficulty emoji
 */
cropSchema.virtual('difficultyEmoji').get(function() {
  const emojiMap = {
    easy: '🟢',
    moderate: '🟡',
    hard: '🔴'
  };
  return emojiMap[this.difficultyLevel] || '⚪';
});

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Check if crop is suitable for given climate conditions
 * @param {Object} climate - { avgTemp, annualRainfall, elevation }
 * @returns {Boolean}
 */
cropSchema.methods.isSuitableFor = function(climate) {
  const tempOk = climate.avgTemp >= this.optimalTempMin && 
                 climate.avgTemp <= this.optimalTempMax;
  const rainOk = climate.annualRainfall >= this.minRainfall && 
                 climate.annualRainfall <= this.maxRainfall;
  const elevOk = climate.elevation >= this.minElevation && 
                 climate.elevation <= this.maxElevation;
  
  return tempOk && rainOk && elevOk;
};

/**
 * Calculate 5-year revenue projection
 * @param {Number} landSize - Hectares
 * @returns {Object}
 */
cropSchema.methods.calculateFiveYearProjection = function(landSize = 1) {
  const years = [];
  const monthsToFirstHarvest = Math.ceil(this.growingSeason / 30);
  
  for (let year = 1; year <= 5; year++) {
    const monthsInYear = year === 1 ? (12 - monthsToFirstHarvest) : 12;
    const harvestsPerYear = Math.floor(monthsInYear / (this.growingSeason / 30));
    
    const revenue = harvestsPerYear * this.expectedYield * this.avgMarketPrice * landSize;
    const costs = this.operatingCost * landSize;
    const profit = revenue - costs;
    
    // Subtract initial investment from first year
    const netProfit = year === 1 ? profit - (this.initialInvestment * landSize) : profit;
    
    years.push({
      year,
      revenue: Math.round(revenue),
      costs: Math.round(costs),
      profit: Math.round(netProfit)
    });
  }
  
  return {
    years,
    totalRevenue: years.reduce((sum, y) => sum + y.revenue, 0),
    totalProfit: years.reduce((sum, y) => sum + y.profit, 0)
  };
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Find crops suitable for given climate
 * @param {Object} climate - { avgTemp, annualRainfall, elevation }
 * @returns {Promise<Crop[]>}
 */
cropSchema.statics.findSuitableCrops = async function(climate) {
  return this.find({
    optimalTempMin: { $lte: climate.avgTemp },
    optimalTempMax: { $gte: climate.avgTemp },
    minRainfall: { $lte: climate.annualRainfall },
    maxRainfall: { $gte: climate.annualRainfall },
    minElevation: { $lte: climate.elevation },
    maxElevation: { $gte: climate.elevation }
  });
};

/**
 * Find crops by category
 * @param {String} category
 * @returns {Promise<Crop[]>}
 */
cropSchema.statics.findByCategory = async function(category) {
  return this.find({ category }).sort({ name_en: 1 });
};

/**
 * Find crops by difficulty level
 * @param {String} difficulty
 * @returns {Promise<Crop[]>}
 */
cropSchema.statics.findByDifficulty = async function(difficulty) {
  return this.find({ difficultyLevel: difficulty }).sort({ name_en: 1 });
};

/**
 * Get crops with highest ROI
 * @param {Number} limit - Number of crops to return
 * @returns {Promise<Crop[]>}
 */
cropSchema.statics.getHighestROI = async function(limit = 10) {
  const crops = await this.find({});
  
  // Calculate ROI for each crop
  const cropsWithROI = crops.map(crop => {
    const roi = ((crop.potentialRevenue - crop.operatingCost) / crop.initialInvestment) * 100;
    return { crop, roi };
  });
  
  // Sort by ROI and return top crops
  return cropsWithROI
    .sort((a, b) => b.roi - a.roi)
    .slice(0, limit)
    .map(item => item.crop);
};

// ============================================================
// PRE-SAVE MIDDLEWARE
// ============================================================

cropSchema.pre('save', function(next) {
  // Validate that max values are greater than min values
  if (this.optimalTempMax <= this.optimalTempMin) {
    return next(new Error('optimalTempMax must be greater than optimalTempMin'));
  }
  if (this.maxRainfall <= this.minRainfall) {
    return next(new Error('maxRainfall must be greater than minRainfall'));
  }
  if (this.maxElevation <= this.minElevation) {
    return next(new Error('maxElevation must be greater than minElevation'));
  }
  
  next();
});

cropSchema.set('toObject', { virtuals: true });
cropSchema.set('toJSON', { virtuals: true });

// ============================================================
// EXPORT MODEL
// ============================================================

const Crop = mongoose.model('Crop', cropSchema);

module.exports = Crop;