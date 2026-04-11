/**
 * Location Model
 * Stores location data with climate information
 * Includes TTL (Time-To-Live) for 24-hour cache expiry
 */

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  // Geographic Coordinates
  latitude: {
    type: Number,
    required: [true, 'Latitude is required'],
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90'],
    index: true
  },
  
  longitude: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180'],
    index: true
  },
  
  elevation: {
    type: Number,
    required: [true, 'Elevation is required'],
    min: [0, 'Elevation cannot be negative'],
    max: [4000, 'Elevation must be below 4000m'],
    index: true // Index for fast elevation queries
  },
  
  // Location Name
  locationName: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    maxlength: [200, 'Location name must be less than 200 characters']
  },
  
  // Climate Data Object
  climateData: {
    // Annual average temperature (°C)
    annualTemp: {
      type: Number,
      required: true,
      min: [-10, 'Temperature must be above -10°C'],
      max: [50, 'Temperature must be below 50°C']
    },
    
    // Monthly average temperatures (12 values, Jan-Dec)
    monthlyTemps: {
      type: [Number],
      validate: {
        validator: function(arr) {
          return arr.length === 12;
        },
        message: 'monthlyTemps must contain exactly 12 values (one per month)'
      },
      required: true
    },
    
    // Annual total rainfall (mm)
    annualRainfall: {
      type: Number,
      required: true,
      min: [0, 'Rainfall cannot be negative'],
      max: [10000, 'Annual rainfall must be below 10,000mm']
    },
    
    // Monthly rainfall (12 values, Jan-Dec)
    monthlyRainfall: {
      type: [Number],
      validate: {
        validator: function(arr) {
          return arr.length === 12;
        },
        message: 'monthlyRainfall must contain exactly 12 values (one per month)'
      },
      required: true
    },
    
    // Average humidity (%)
    avgHumidity: {
      type: Number,
      required: true,
      min: [0, 'Humidity must be between 0-100%'],
      max: [100, 'Humidity must be between 0-100%']
    },
    
    // Growing season length (days per year)
    growingSeason: {
      type: Number,
      required: true,
      min: [0, 'Growing season cannot be negative'],
      max: [365, 'Growing season cannot exceed 365 days']
    }
  },
  
  // Cache Management
  cacheExpiry: {
    type: Date,
    required: true,
    default: function() {
      // Set expiry to 24 hours from now
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    },
    index: true
  }
  
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'locations'
});

// ============================================================
// INDEXES
// ============================================================

// Compound index for finding locations by coordinates
locationSchema.index({ latitude: 1, longitude: 1 });

// Index for finding locations within elevation range
locationSchema.index({ elevation: 1 });

// TTL index - MongoDB will automatically delete documents after cacheExpiry
locationSchema.index({ cacheExpiry: 1 }, { expireAfterSeconds: 0 });

// ============================================================
// VIRTUAL FIELDS
// ============================================================

/**
 * Check if cache is still valid
 */
locationSchema.virtual('isCacheValid').get(function() {
  return this.cacheExpiry > new Date();
});

/**
 * Get coordinate string for display
 */
locationSchema.virtual('coordinateString').get(function() {
  return `${this.latitude.toFixed(4)}, ${this.longitude.toFixed(4)}`;
});

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Refresh cache expiry to 24 hours from now
 */
locationSchema.methods.refreshCache = function() {
  this.cacheExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return this.save();
};

/**
 * Check if this location matches another within tolerance
 * @param {Number} lat - Latitude to compare
 * @param {Number} lng - Longitude to compare
 * @param {Number} tolerance - Distance tolerance in degrees (default: 0.01 ≈ 1km)
 * @returns {Boolean}
 */
locationSchema.methods.isNearby = function(lat, lng, tolerance = 0.01) {
  const latDiff = Math.abs(this.latitude - lat);
  const lngDiff = Math.abs(this.longitude - lng);
  return latDiff < tolerance && lngDiff < tolerance;
};

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Find a location by coordinates (with tolerance)
 * @param {Number} latitude
 * @param {Number} longitude
 * @param {Number} tolerance - Distance tolerance (default: 0.01)
 * @returns {Promise<Location|null>}
 */
locationSchema.statics.findByCoordinates = async function(latitude, longitude, tolerance = 0.01) {
  return this.findOne({
    latitude: { $gte: latitude - tolerance, $lte: latitude + tolerance },
    longitude: { $gte: longitude - tolerance, $lte: longitude + tolerance },
    cacheExpiry: { $gt: new Date() } // Only return valid cache
  });
};

/**
 * Find locations within elevation range
 * @param {Number} minElev
 * @param {Number} maxElev
 * @returns {Promise<Location[]>}
 */
locationSchema.statics.findByElevationRange = async function(minElev, maxElev) {
  return this.find({
    elevation: { $gte: minElev, $lte: maxElev },
    cacheExpiry: { $gt: new Date() }
  });
};

/**
 * Clean expired cache entries (manual cleanup, though TTL index handles this automatically)
 * @returns {Promise<Object>}
 */
locationSchema.statics.cleanExpiredCache = async function() {
  return this.deleteMany({
    cacheExpiry: { $lt: new Date() }
  });
};

// ============================================================
// PRE-SAVE MIDDLEWARE
// ============================================================

locationSchema.pre('save', function(next) {
  // Validate Taiwan coordinates (optional, can remove if you want global support)
  const isInTaiwan = (
    this.latitude >= 21 && this.latitude <= 26 &&
    this.longitude >= 119 && this.longitude <= 122
  );
  
  if (!isInTaiwan) {
    console.warn(`⚠️  Location outside Taiwan: ${this.coordinateString}`);
    // Don't block, just warn
  }
  
  next();
});

// ============================================================
// EXPORT MODEL
// ============================================================

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;