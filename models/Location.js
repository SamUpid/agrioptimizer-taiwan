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
    max: [90, 'Latitude must be between -90 and 90']
  },

  longitude: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  },

  elevation: {
    type: Number,
    required: [true, 'Elevation is required'],
    min: [0, 'Elevation cannot be negative'],
    max: [4000, 'Elevation must be below 4000m']
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
    annualTemp: {
      type: Number,
      required: true,
      min: [-10, 'Temperature must be above -10°C'],
      max: [50, 'Temperature must be below 50°C']
    },
    monthlyTemps: {
      type: [Number],
      validate: {
        validator: function(arr) { return arr.length === 12; },
        message: 'monthlyTemps must contain exactly 12 values (one per month)'
      },
      required: true
    },
    annualRainfall: {
      type: Number,
      required: true,
      min: [0, 'Rainfall cannot be negative'],
      max: [10000, 'Annual rainfall must be below 10,000mm']
    },
    monthlyRainfall: {
      type: [Number],
      validate: {
        validator: function(arr) { return arr.length === 12; },
        message: 'monthlyRainfall must contain exactly 12 values (one per month)'
      },
      required: true
    },
    avgHumidity: {
      type: Number,
      required: true,
      min: [0, 'Humidity must be between 0-100%'],
      max: [100, 'Humidity must be between 0-100%']
    },
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
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    // removed index:true — declared via schema.index() below
  }

}, {
  timestamps: true,
  collection: 'locations'
});

// ============================================================
// INDEXES — single declarations, no duplicates
// ============================================================

locationSchema.index({ latitude: 1, longitude: 1 });
locationSchema.index({ elevation: 1 });
locationSchema.index({ cacheExpiry: 1 }, { expireAfterSeconds: 0 });

// ============================================================
// VIRTUAL FIELDS
// ============================================================

locationSchema.virtual('isCacheValid').get(function() {
  return this.cacheExpiry > new Date();
});

locationSchema.virtual('coordinateString').get(function() {
  return `${this.latitude.toFixed(4)}, ${this.longitude.toFixed(4)}`;
});

// ============================================================
// INSTANCE METHODS
// ============================================================

locationSchema.methods.refreshCache = function() {
  this.cacheExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return this.save();
};

locationSchema.methods.isNearby = function(lat, lng, tolerance = 0.01) {
  return Math.abs(this.latitude - lat) < tolerance &&
         Math.abs(this.longitude - lng) < tolerance;
};

// ============================================================
// STATIC METHODS
// ============================================================

locationSchema.statics.findByCoordinates = async function(latitude, longitude, tolerance = 0.01) {
  return this.findOne({
    latitude:    { $gte: latitude  - tolerance, $lte: latitude  + tolerance },
    longitude:   { $gte: longitude - tolerance, $lte: longitude + tolerance },
    cacheExpiry: { $gt: new Date() }
  });
};

locationSchema.statics.findByElevationRange = async function(minElev, maxElev) {
  return this.find({
    elevation:   { $gte: minElev, $lte: maxElev },
    cacheExpiry: { $gt: new Date() }
  });
};

locationSchema.statics.cleanExpiredCache = async function() {
  return this.deleteMany({ cacheExpiry: { $lt: new Date() } });
};

// ============================================================
// PRE-SAVE MIDDLEWARE
// ============================================================

locationSchema.pre('save', function(next) {
  const isInTaiwan = (
    this.latitude  >= 21  && this.latitude  <= 26 &&
    this.longitude >= 119 && this.longitude <= 122
  );
  if (!isInTaiwan) {
    console.warn(`⚠️  Location outside Taiwan: ${this.coordinateString}`);
  }
  next();
});

module.exports = mongoose.model('Location', locationSchema);