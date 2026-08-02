/**
 * CompanionCrop Model
 * Stores intercropping and companion planting relationships
 */

const mongoose = require('mongoose');

const companionCropSchema = new mongoose.Schema({
  // ============================================================
  // CROP RELATIONSHIP
  // ============================================================

  primaryCropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: [true, 'Primary crop ID is required']
    // removed index:true — declared via schema.index() below
  },

  companionCropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: [true, 'Companion crop ID is required']
    // removed index:true — declared via schema.index() below
  },

  // ============================================================
  // COMPATIBILITY METRICS
  // ============================================================

  compatibilityScore: {
    type: Number,
    required: [true, 'Compatibility score is required'],
    min: [0, 'Score must be between 0-100'],
    max: [100, 'Score must be between 0-100']
    // removed index:true — declared via schema.index() below
  },

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
  // AGRONOMIC BENEFITS
  // ============================================================

  pestControl:       { type: Boolean, default: false },
  nitrogenFixation:  { type: Boolean, default: false },
  soilImprovement:   { type: Boolean, default: false },
  pollination:       { type: Boolean, default: false },
  shadeProvision:    { type: Boolean, default: false },
  weedSuppression:   { type: Boolean, default: false },

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
    default: false
  }

}, {
  timestamps: true,
  collection: 'companion_crops'
});

// ============================================================
// INDEXES — single declarations, no duplicates
// ============================================================

companionCropSchema.index({ primaryCropId: 1, compatibilityScore: -1 });
companionCropSchema.index({ companionCropId: 1 });
companionCropSchema.index({ primaryCropId: 1, companionCropId: 1 }, { unique: true });
companionCropSchema.index({ spatialArrangement: 1 });
companionCropSchema.index({ compatibilityScore: -1 });

// ============================================================
// VIRTUAL FIELDS
// ============================================================

companionCropSchema.virtual('compatibilityLevel').get(function() {
  if (this.compatibilityScore >= 90) return 'Excellent';
  if (this.compatibilityScore >= 75) return 'Very Good';
  if (this.compatibilityScore >= 60) return 'Good';
  if (this.compatibilityScore >= 40) return 'Moderate';
  return 'Poor';
});

companionCropSchema.virtual('compatibilityEmoji').get(function() {
  if (this.compatibilityScore >= 90) return '💚';
  if (this.compatibilityScore >= 75) return '✅';
  if (this.compatibilityScore >= 60) return '👍';
  if (this.compatibilityScore >= 40) return '⚠️';
  return '❌';
});

companionCropSchema.virtual('yieldImpactEmoji').get(function() {
  const map = { 'highly-positive': '📈', 'positive': '⬆️', 'neutral': '➡️', 'negative': '⬇️' };
  return map[this.yieldImpact] || '➡️';
});

companionCropSchema.virtual('benefitCount').get(function() {
  return [
    this.pestControl, this.nitrogenFixation, this.soilImprovement,
    this.pollination, this.shadeProvision, this.weedSuppression
  ].filter(Boolean).length;
});

companionCropSchema.virtual('agronomicBenefits').get(function() {
  const benefits = [];
  if (this.pestControl)      benefits.push('Pest Control');
  if (this.nitrogenFixation) benefits.push('Nitrogen Fixation');
  if (this.soilImprovement)  benefits.push('Soil Improvement');
  if (this.pollination)      benefits.push('Pollination');
  if (this.shadeProvision)   benefits.push('Shade Provision');
  if (this.weedSuppression)  benefits.push('Weed Suppression');
  return benefits;
});

// ============================================================
// INSTANCE METHODS
// ============================================================

companionCropSchema.methods.isHighQuality = function() {
  return this.compatibilityScore >= 75;
};

companionCropSchema.methods.isNitrogenFixer = function() {
  return this.nitrogenFixation === true;
};

companionCropSchema.methods.getArrangementDescription = function() {
  const descriptions = {
    intercrop:  'Plant in alternating rows between main crop',
    understory: 'Plant beneath main crop canopy',
    rotation:   'Plant in sequence with main crop (not simultaneously)',
    border:     'Plant around perimeter of main crop field',
    mixed:      'Integrate throughout main crop area'
  };
  return descriptions[this.spatialArrangement] || 'Follow recommended spacing';
};

// ============================================================
// STATIC METHODS
// ============================================================

companionCropSchema.statics.findCompanionsFor = async function(cropId, minScore = 60) {
  return this.find({ primaryCropId: cropId, compatibilityScore: { $gte: minScore } })
    .populate('companionCropId')
    .sort({ compatibilityScore: -1 });
};

companionCropSchema.statics.findBestCompanionsFor = async function(cropId) {
  return this.findCompanionsFor(cropId, 75);
};

companionCropSchema.statics.findByArrangement = async function(cropId, arrangement) {
  return this.find({ primaryCropId: cropId, spatialArrangement: arrangement })
    .populate('companionCropId')
    .sort({ compatibilityScore: -1 });
};

companionCropSchema.statics.findNitrogenFixers = async function(cropId) {
  return this.find({ primaryCropId: cropId, nitrogenFixation: true })
    .populate('companionCropId')
    .sort({ compatibilityScore: -1 });
};

companionCropSchema.statics.findPestControllers = async function(cropId) {
  return this.find({ primaryCropId: cropId, pestControl: true })
    .populate('companionCropId')
    .sort({ compatibilityScore: -1 });
};

companionCropSchema.statics.findAllRelationships = async function(cropId) {
  return this.find({ $or: [{ primaryCropId: cropId }, { companionCropId: cropId }] })
    .populate('primaryCropId companionCropId')
    .sort({ compatibilityScore: -1 });
};

companionCropSchema.statics.getCompanionStats = async function(cropId) {
  const companions = await this.find({ primaryCropId: cropId });
  return {
    totalCompanions:      companions.length,
    excellentCompanions:  companions.filter(c => c.compatibilityScore >= 90).length,
    goodCompanions:       companions.filter(c => c.compatibilityScore >= 60).length,
    nitrogenFixers:       companions.filter(c => c.nitrogenFixation).length,
    pestControllers:      companions.filter(c => c.pestControl).length,
    avgCompatibility:     companions.length > 0
      ? companions.reduce((sum, c) => sum + c.compatibilityScore, 0) / companions.length
      : 0
  };
};

// ============================================================
// PRE/POST MIDDLEWARE
// ============================================================

companionCropSchema.pre('save', async function(next) {
  if (this.primaryCropId.equals(this.companionCropId))
    return next(new Error('A crop cannot be its own companion'));
  next();
});

companionCropSchema.post('save', function(doc, next) {
  console.log(`✅ Companion relationship saved: ${doc.primaryCropId} <-> ${doc.companionCropId} (Score: ${doc.compatibilityScore})`);
  next();
});

module.exports = mongoose.model('CompanionCrop', companionCropSchema);