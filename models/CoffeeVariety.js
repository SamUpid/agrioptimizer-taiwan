/**
 * CoffeeVariety Model
 * Specialized coffee variety data for Taiwan's coffee-growing regions
 * Used in Module 3: Coffee Specialty Module
 */

const mongoose = require('mongoose');

const coffeeVarietySchema = new mongoose.Schema({
  // ============================================================
  // BASIC INFORMATION
  // ============================================================
  
  varietyName: {
    type: String,
    required: [true, 'Variety name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Variety name must be less than 100 characters'],
    index: true
  },
  
  varietyName_zh: {
    type: String,
    trim: true,
    maxlength: [100, 'Chinese name must be less than 100 characters']
  },

 imageUrl: {
  type: String,
  trim: true,
  default: function() {
    return `https://placehold.co/400x300/198754/FFFFFF?text=${this.name_en}`;
  }
},
  
  // ============================================================
  // CLIMATE REQUIREMENTS (Coffee-Specific)
  // ============================================================
  
  optimalElevationMin: {
    type: Number,
    required: [true, 'Minimum elevation is required'],
    min: [0, 'Elevation cannot be negative'],
    max: [3000, 'Elevation must be below 3000m']
  },
  
  optimalElevationMax: {
    type: Number,
    required: [true, 'Maximum elevation is required'],
    min: [0, 'Elevation cannot be negative'],
    max: [3000, 'Elevation must be below 3000m'],
    validate: {
      validator: function(value) {
        return value > this.optimalElevationMin;
      },
      message: 'Max elevation must be greater than min elevation'
    }
  },
  
  // Day-night temperature differential requirement (°C)
  tempDifferentialMin: {
    type: Number,
    required: [true, 'Minimum temperature differential is required'],
    min: [0, 'Temperature differential cannot be negative'],
    max: [30, 'Temperature differential must be below 30°C']
  },
  
  // ============================================================
  // COFFEE QUALITY CHARACTERISTICS
  // ============================================================
  
  diseaseResistance: {
    type: String,
    required: [true, 'Disease resistance level is required'],
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Disease resistance must be: low, medium, or high'
    }
  },
  
  // SCAA (Specialty Coffee Association of America) cup quality score
  cupQualityMin: {
    type: Number,
    required: [true, 'Minimum cup quality score is required'],
    min: [60, 'Cup quality must be at least 60 (SCAA scale)'],
    max: [100, 'Cup quality must be at most 100']
  },
  
  cupQualityMax: {
    type: Number,
    required: [true, 'Maximum cup quality score is required'],
    min: [60, 'Cup quality must be at least 60 (SCAA scale)'],
    max: [100, 'Cup quality must be at most 100'],
    validate: {
      validator: function(value) {
        return value >= this.cupQualityMin;
      },
      message: 'Max cup quality must be greater than or equal to min'
    }
  },
  
  // ============================================================
  // HARVEST & PROCESSING
  // ============================================================
  
  harvestMonths: {
    type: String,
    required: [true, 'Harvest months are required'],
    trim: true,
    maxlength: [100, 'Harvest months description must be less than 100 characters']
  },
  
  processingMethods: {
    type: [String],
    required: [true, 'At least one processing method is required'],
    validate: {
      validator: function(arr) {
        return arr.length > 0 && arr.every(method => 
          ['washed', 'natural', 'honey', 'wet-hulled', 'anaerobic'].includes(method)
        );
      },
      message: 'Processing methods must be one of: washed, natural, honey, wet-hulled, anaerobic'
    }
  },
  
  // ============================================================
  // FLAVOR PROFILE
  // ============================================================
  
  flavorNotes_en: {
    type: String,
    trim: true,
    maxlength: [200, 'Flavor notes must be less than 200 characters']
  },
  
  flavorNotes_zh: {
    type: String,
    trim: true,
    maxlength: [200, 'Flavor notes must be less than 200 characters']
  },
  
  // ============================================================
  // CULTIVATION TIPS
  // ============================================================
  
  qualityTips_en: {
    type: String,
    required: [true, 'Quality tips (English) are required'],
    trim: true,
    maxlength: [500, 'Quality tips must be less than 500 characters']
  },
  
  qualityTips_zh: {
    type: String,
    trim: true,
    maxlength: [500, 'Quality tips must be less than 500 characters']
  },
  
  // ============================================================
  // ECONOMIC DATA (Coffee-Specific)
  // ============================================================
  
  yieldPerTree: {
    type: Number,
    min: [0, 'Yield cannot be negative'],
    max: [10, 'Yield per tree must be below 10 kg']
  },
  
  treesPerHectare: {
    type: Number,
    default: 1000,
    min: [500, 'Trees per hectare must be at least 500'],
    max: [3000, 'Trees per hectare must be below 3000']
  },
  
  yearsToFirstHarvest: {
    type: Number,
    default: 3,
    min: [2, 'Years to first harvest must be at least 2'],
    max: [5, 'Years to first harvest must be below 5']
  },
  
  productiveYears: {
    type: Number,
    default: 20,
    min: [10, 'Productive years must be at least 10'],
    max: [50, 'Productive years must be below 50']
  }
  
}, {
  timestamps: true,
  collection: 'coffee_varieties'
});

// ============================================================
// INDEXES
// ============================================================

// Index for elevation-based queries
coffeeVarietySchema.index({ 
  optimalElevationMin: 1, 
  optimalElevationMax: 1 
});

// Index for quality-based queries
coffeeVarietySchema.index({ cupQualityMin: 1, cupQualityMax: 1 });

// Index for disease resistance
coffeeVarietySchema.index({ diseaseResistance: 1 });

// ============================================================
// VIRTUAL FIELDS
// ============================================================

/**
 * Get elevation range as string
 */
coffeeVarietySchema.virtual('elevationRange').get(function() {
  return `${this.optimalElevationMin}m - ${this.optimalElevationMax}m`;
});

/**
 * Get average cup quality
 */
coffeeVarietySchema.virtual('avgCupQuality').get(function() {
  return (this.cupQualityMin + this.cupQualityMax) / 2;
});

/**
 * Get quality grade based on SCAA score
 */
coffeeVarietySchema.virtual('qualityGrade').get(function() {
  const avg = this.avgCupQuality;
  if (avg >= 90) return 'Outstanding';
  if (avg >= 85) return 'Excellent';
  if (avg >= 80) return 'Very Good';
  if (avg >= 75) return 'Good';
  return 'Fair';
});

/**
 * Calculate potential yield per hectare
 */
coffeeVarietySchema.virtual('yieldPerHectare').get(function() {
  if (!this.yieldPerTree) return null;
  return this.yieldPerTree * this.treesPerHectare;
});

/**
 * Get disease resistance emoji
 */
coffeeVarietySchema.virtual('diseaseResistanceEmoji').get(function() {
  const emojiMap = {
    low: '🔴',
    medium: '🟡',
    high: '🟢'
  };
  return emojiMap[this.diseaseResistance] || '⚪';
});

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Check if variety is suitable for given elevation
 * @param {Number} elevation - Elevation in meters
 * @returns {Boolean}
 */
coffeeVarietySchema.methods.isSuitableForElevation = function(elevation) {
  return elevation >= this.optimalElevationMin && 
         elevation <= this.optimalElevationMax;
};

/**
 * Check if variety meets desired quality threshold
 * @param {Number} minQuality - Minimum SCAA score required
 * @returns {Boolean}
 */
coffeeVarietySchema.methods.meetsQualityThreshold = function(minQuality) {
  return this.cupQualityMax >= minQuality;
};

/**
 * Get recommended processing method for this variety
 * @returns {String}
 */
coffeeVarietySchema.methods.getRecommendedProcessing = function() {
  // Prioritize: washed > honey > natural
  if (this.processingMethods.includes('washed')) return 'washed';
  if (this.processingMethods.includes('honey')) return 'honey';
  return this.processingMethods[0];
};

/**
 * Calculate estimated annual income (per hectare)
 * @param {Number} pricePerKg - Market price in NT$/kg
 * @returns {Number}
 */
coffeeVarietySchema.methods.calculateAnnualIncome = function(pricePerKg = 600) {
  if (!this.yieldPerTree) return null;
  const totalYield = this.yieldPerTree * this.treesPerHectare;
  return totalYield * pricePerKg;
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Find varieties suitable for elevation range
 * @param {Number} elevation
 * @param {Number} tolerance - Tolerance in meters (default: 100)
 * @returns {Promise<CoffeeVariety[]>}
 */
coffeeVarietySchema.statics.findByElevation = async function(elevation, tolerance = 100) {
  return this.find({
    optimalElevationMin: { $lte: elevation + tolerance },
    optimalElevationMax: { $gte: elevation - tolerance }
  }).sort({ cupQualityMax: -1 }); // Sort by highest quality
};

/**
 * Find varieties with high disease resistance
 * @returns {Promise<CoffeeVariety[]>}
 */
coffeeVarietySchema.statics.findDiseaseResistant = async function() {
  return this.find({ diseaseResistance: 'high' }).sort({ varietyName: 1 });
};

/**
 * Find varieties by cup quality threshold
 * @param {Number} minQuality - Minimum SCAA score
 * @returns {Promise<CoffeeVariety[]>}
 */
coffeeVarietySchema.statics.findByQuality = async function(minQuality = 80) {
  return this.find({
    cupQualityMin: { $gte: minQuality }
  }).sort({ cupQualityMax: -1 });
};

/**
 * Get varieties suitable for Taiwan's mountain regions (800-1500m)
 * @returns {Promise<CoffeeVariety[]>}
 */
coffeeVarietySchema.statics.findForTaiwanMountains = async function() {
  return this.find({
    optimalElevationMin: { $lte: 1500 },
    optimalElevationMax: { $gte: 800 }
  }).sort({ cupQualityMax: -1 });
};

// ============================================================
// PRE-SAVE MIDDLEWARE
// ============================================================

coffeeVarietySchema.pre('save', function(next) {
  // Ensure max elevation is greater than min
  if (this.optimalElevationMax <= this.optimalElevationMin) {
    return next(new Error('optimalElevationMax must be greater than optimalElevationMin'));
  }
  
  // Ensure cup quality max is at least equal to min
  if (this.cupQualityMax < this.cupQualityMin) {
    return next(new Error('cupQualityMax must be greater than or equal to cupQualityMin'));
  }
  
  next();
});

// ============================================================
// EXPORT MODEL
// ============================================================

const CoffeeVariety = mongoose.model('CoffeeVariety', coffeeVarietySchema);

module.exports = CoffeeVariety;