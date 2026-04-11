/**
 * CompanionCrop Model
 * Stores intercropping and companion planting relationships
 * Used in Module 5: Companion Crops feature
 */

const mongoose = require('mongoose');

const companionCropSchema = new mongoose.Schema({
  // ============================================================
  // CROP RELATIONSHIP
  // ============================================================
  
  primaryCropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: [true, 'Primary crop ID is required'],
    index: true
  },
  
  companionCropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: [true, 'Companion crop ID is required'],
    index: true
  },
  
  // ============================================================
  // COMPATIBILITY METRICS
  // ============================================================
  
  compatibilityScore: {
    type: Number,
    required: [true, 'Compatibility score is required'],
    min: [0, 'Score must be between 0-100'],
    max: [100, 'Score must be between 0-100'],
    index: true
  },
  
  // Type of spatial arrangement
  spatialArrangement: {
    type: String,
    required: [true, 'Spatial arrangement is required'],
    enum: {
      values: ['intercrop', 'understory', 'rotation', 'border', 'mixed'],
      message: 'Arrangement must be: intercrop, understory, rotation, border, or mixed'
    }
  },
  
  // ============================================================
  // BENEFITS (Bilingual)
  // ============================================================
  
  benefits_en: {
    type: String,
    required: [true, 'English benefits description is required'],
    trim: true,
    maxlength: [500, 'Benefits must be less than 500 characters']
  },
  
  benefits_zh: {
    type: String,
    trim: true,
    maxlength: [500, 'Benefits must be less than 500 characters']
  },
  
  // ============================================================
  // PLANTING DETAILS
  // ============================================================
  
  plantingRatio: {
    type: String,
    trim: true,
    maxlength: [50, 'Planting ratio must be less than 50 characters']
  },
  
  spacingRecommendation: {
    type: String,
    trim: true,
    maxlength: [100, 'Spacing recommendation must be less than 100 characters']
  },
  
  // ============================================================
  // AGRONOMIC BENEFITS (Checkboxes)
  // ============================================================
  
  pestControl: {
    type: Boolean,
    default: false
  },
  
  nitrogenFixation: {
    type: Boolean,
    default: false
  },
  
  soilImprovement: {
    type: Boolean,
    default: false
  },
  
  pollination: {
    type: Boolean,
    default: false
  },
  
  shadeProvision: {
    type: Boolean,
    default: false
  },
  
  weedSuppression: {
    type: Boolean,
    default: false
  },
  
  // ============================================================
  // TIMING & MANAGEMENT
  // ============================================================
  
  plantingTimingNotes: {
    type: String,
    trim: true,
    maxlength: [200, 'Timing notes must be less than 200 characters']
  },
  
  managementTips_en: {
    type: String,
    trim: true,
    maxlength: [300, 'Management tips must be less than 300 characters']
  },
  
  managementTips_zh: {
    type: String,
    trim: true,
    maxlength: [300, 'Management tips must be less than 300 characters']
  },
  
  // ============================================================
  // ECONOMIC IMPACT
  // ============================================================
  
  yieldImpact: {
    type: String,
    enum: {
      values: ['negative', 'neutral', 'positive', 'highly-positive'],
      message: 'Yield impact must be: negative, neutral, positive, or highly-positive'
    },
    default: 'neutral'
  },
  
  additionalIncome: {
    type: Boolean,
    default: false,
    description: 'Whether companion crop provides additional harvestable yield'
  }
  
}, {
  timestamps: true,
  collection: 'companion_crops'
});

// ============================================================
// INDEXES
// ============================================================

// Compound index for finding companions for a specific crop
companionCropSchema.index({ primaryCropId: 1, compatibilityScore: -1 });

// Index for reverse lookup (what crops work with this companion)
companionCropSchema.index({ companionCropId: 1 });

// Compound unique index to prevent duplicate pairings
companionCropSchema.index(
  { primaryCropId: 1, companionCropId: 1 }, 
  { unique: true }
);

// Index for spatial arrangement filtering
companionCropSchema.index({ spatialArrangement: 1 });

// Index for high compatibility scores
companionCropSchema.index({ compatibilityScore: -1 });

// ============================================================
// VIRTUAL FIELDS
// ============================================================

/**
 * Get compatibility level as string
 */
companionCropSchema.virtual('compatibilityLevel').get(function() {
  if (this.compatibilityScore >= 90) return 'Excellent';
  if (this.compatibilityScore >= 75) return 'Very Good';
  if (this.compatibilityScore >= 60) return 'Good';
  if (this.compatibilityScore >= 40) return 'Moderate';
  return 'Poor';
});

/**
 * Get compatibility emoji
 */
companionCropSchema.virtual('compatibilityEmoji').get(function() {
  if (this.compatibilityScore >= 90) return '💚';
  if (this.compatibilityScore >= 75) return '✅';
  if (this.compatibilityScore >= 60) return '👍';
  if (this.compatibilityScore >= 40) return '⚠️';
  return '❌';
});

/**
 * Get yield impact emoji
 */
companionCropSchema.virtual('yieldImpactEmoji').get(function() {
  const emojiMap = {
    'highly-positive': '📈',
    'positive': '⬆️',
    'neutral': '➡️',
    'negative': '⬇️'
  };
  return emojiMap[this.yieldImpact] || '➡️';
});

/**
 * Count number of agronomic benefits
 */
companionCropSchema.virtual('benefitCount').get(function() {
  let count = 0;
  if (this.pestControl) count++;
  if (this.nitrogenFixation) count++;
  if (this.soilImprovement) count++;
  if (this.pollination) count++;
  if (this.shadeProvision) count++;
  if (this.weedSuppression) count++;
  return count;
});

/**
 * Get list of agronomic benefits
 */
companionCropSchema.virtual('agronomicBenefits').get(function() {
  const benefits = [];
  if (this.pestControl) benefits.push('Pest Control');
  if (this.nitrogenFixation) benefits.push('Nitrogen Fixation');
  if (this.soilImprovement) benefits.push('Soil Improvement');
  if (this.pollination) benefits.push('Pollination');
  if (this.shadeProvision) benefits.push('Shade Provision');
  if (this.weedSuppression) benefits.push('Weed Suppression');
  return benefits;
});

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Check if this is a high-quality companion pairing
 * @returns {Boolean}
 */
companionCropSchema.methods.isHighQuality = function() {
  return this.compatibilityScore >= 75;
};

/**
 * Check if companion provides nitrogen fixation
 * @returns {Boolean}
 */
companionCropSchema.methods.isNitrogenFixer = function() {
  return this.nitrogenFixation === true;
};

/**
 * Get recommended arrangement description
 * @returns {String}
 */
companionCropSchema.methods.getArrangementDescription = function() {
  const descriptions = {
    intercrop: 'Plant in alternating rows between main crop',
    understory: 'Plant beneath main crop canopy',
    rotation: 'Plant in sequence with main crop (not simultaneously)',
    border: 'Plant around perimeter of main crop field',
    mixed: 'Integrate throughout main crop area'
  };
  return descriptions[this.spatialArrangement] || 'Follow recommended spacing';
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Find all companions for a specific crop
 * @param {ObjectId} cropId - Primary crop ID
 * @param {Number} minScore - Minimum compatibility score (default: 60)
 * @returns {Promise<CompanionCrop[]>}
 */
companionCropSchema.statics.findCompanionsFor = async function(cropId, minScore = 60) {
  return this.find({
    primaryCropId: cropId,
    compatibilityScore: { $gte: minScore }
  })
  .populate('companionCropId')
  .sort({ compatibilityScore: -1 });
};

/**
 * Find best companions (score >= 75)
 * @param {ObjectId} cropId
 * @returns {Promise<CompanionCrop[]>}
 */
companionCropSchema.statics.findBestCompanionsFor = async function(cropId) {
  return this.findCompanionsFor(cropId, 75);
};

/**
 * Find companions by spatial arrangement
 * @param {ObjectId} cropId
 * @param {String} arrangement
 * @returns {Promise<CompanionCrop[]>}
 */
companionCropSchema.statics.findByArrangement = async function(cropId, arrangement) {
  return this.find({
    primaryCropId: cropId,
    spatialArrangement: arrangement
  })
  .populate('companionCropId')
  .sort({ compatibilityScore: -1 });
};

/**
 * Find nitrogen-fixing companions
 * @param {ObjectId} cropId
 * @returns {Promise<CompanionCrop[]>}
 */
companionCropSchema.statics.findNitrogenFixers = async function(cropId) {
  return this.find({
    primaryCropId: cropId,
    nitrogenFixation: true
  })
  .populate('companionCropId')
  .sort({ compatibilityScore: -1 });
};

/**
 * Find pest control companions
 * @param {ObjectId} cropId
 * @returns {Promise<CompanionCrop[]>}
 */
companionCropSchema.statics.findPestControllers = async function(cropId) {
  return this.find({
    primaryCropId: cropId,
    pestControl: true
  })
  .populate('companionCropId')
  .sort({ compatibilityScore: -1 });
};

/**
 * Find all companion relationships (both directions)
 * @param {ObjectId} cropId
 * @returns {Promise<CompanionCrop[]>}
 */
companionCropSchema.statics.findAllRelationships = async function(cropId) {
  // Find where crop is primary OR companion
  return this.find({
    $or: [
      { primaryCropId: cropId },
      { companionCropId: cropId }
    ]
  })
  .populate('primaryCropId companionCropId')
  .sort({ compatibilityScore: -1 });
};

/**
 * Get companion statistics for a crop
 * @param {ObjectId} cropId
 * @returns {Promise<Object>}
 */
companionCropSchema.statics.getCompanionStats = async function(cropId) {
  const companions = await this.find({ primaryCropId: cropId });
  
  return {
    totalCompanions: companions.length,
    excellentCompanions: companions.filter(c => c.compatibilityScore >= 90).length,
    goodCompanions: companions.filter(c => c.compatibilityScore >= 60).length,
    nitrogenFixers: companions.filter(c => c.nitrogenFixation).length,
    pestControllers: companions.filter(c => c.pestControl).length,
    avgCompatibility: companions.length > 0 
      ? companions.reduce((sum, c) => sum + c.compatibilityScore, 0) / companions.length 
      : 0
  };
};

// ============================================================
// PRE-SAVE MIDDLEWARE
// ============================================================

companionCropSchema.pre('save', async function(next) {
  // Prevent a crop from being its own companion
  if (this.primaryCropId.equals(this.companionCropId)) {
    return next(new Error('A crop cannot be its own companion'));
  }
  
  next();
});

// ============================================================
// POST-SAVE MIDDLEWARE
// ============================================================

companionCropSchema.post('save', function(doc, next) {
  console.log(`✅ Companion relationship saved: ${doc.primaryCropId} <-> ${doc.companionCropId} (Score: ${doc.compatibilityScore})`);
  next();
});

// ============================================================
// EXPORT MODEL
// ============================================================

const CompanionCrop = mongoose.model('CompanionCrop', companionCropSchema);

module.exports = CompanionCrop;