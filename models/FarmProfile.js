/**
 * FarmProfile Model
 * Stores farmer-specific farm information and preferences
 * 
 * CHANGES FROM PREVIOUS VERSION:
 * - userId changed from String → ObjectId (fixes lookup mismatch with User._id)
 * - crops[] now enforces max 8 via schema validator
 * - coffees[] added with max 5 validator
 * - location.elevation kept as the key field for recommendations
 */

const mongoose = require('mongoose');

// ── CROP SUB-SCHEMA ──────────────────────────────────────────
const cropSchema = new mongoose.Schema({
  cropId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop'
  },
  cropName: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true,
    maxlength: [100, 'Crop name must be less than 100 characters']
  },
  cropNameZh: {
    type: String,
    trim: true,
    maxlength: [100, 'Chinese crop name must be less than 100 characters']
  },
  altitudeZone: {
    type: String,
    enum: ['lowland', 'mid', 'high', 'alpine'],
    // which zone this crop was recommended for — useful for filtering later
  },
  areaHectares: {
    type: Number,
    min: [0, 'Area cannot be negative'],
    max: [1000, 'Area must be less than 1000 hectares'],
    default: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// ── COFFEE SUB-SCHEMA ────────────────────────────────────────
const coffeeSchema = new mongoose.Schema({
  coffeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coffee'
  },
  coffeeName: {
    type: String,
    required: [true, 'Coffee name is required'],
    trim: true,
    maxlength: [100, 'Coffee name must be less than 100 characters']
  },
  coffeeNameZh: {
    type: String,
    trim: true,
    maxlength: [100, 'Chinese coffee name must be less than 100 characters']
  },
  variety: {
    type: String,
    trim: true,
    // e.g. Arabica, Geisha, Typica, Bourbon
  },
  altitudeZone: {
    type: String,
    enum: {
      values: ['lowland', 'mid', 'high', 'alpine'],
      message: '{VALUE} is not a valid altitude zone'
    },
    required: false,
    default: undefined
  },
  areaHectares: {
    type: Number,
    min: [0, 'Area cannot be negative'],
    default: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// ── MAIN FARM PROFILE SCHEMA ─────────────────────────────────
const farmProfileSchema = new mongoose.Schema({

  // ── LINK TO USER ────────────────────────────────────────────
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
    // NOTE: changed from String to ObjectId to match User._id type
    // If you have existing data, run the migration script below
  },

  farmName: {
    type: String,
    default: 'My Farm',
    trim: true,
    maxlength: [100, 'Farm name must be less than 100 characters']
  },

  // ── LOCATION ────────────────────────────────────────────────
  // This is the single location (no multiple plots in v1)
  location: {
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address must be less than 200 characters']
    },
    coordinates: {
      lat: {
        type: Number,
        min: [21.5, 'Latitude must be within Taiwan (21.5–26.0)'],
        max: [26.0, 'Latitude must be within Taiwan (21.5–26.0)']
      },
      lng: {
        type: Number,
        min: [119.0, 'Longitude must be within Taiwan (119.0–122.5)'],
        max: [122.5, 'Longitude must be within Taiwan (119.0–122.5)']
      }
    },
    elevation: {
      type: Number,
      min: [0, 'Elevation cannot be negative'],
      max: [4000, 'Elevation must be below 4000m']
      // This is the KEY field — drives all recommendations
    },
    // Which altitude zone this elevation falls in
    // Computed and stored when location is saved
    altitudeZone: {
      type: String,
      enum: ['lowland', 'mid', 'high', 'alpine'],
      // lowland: 200–800m
      // mid:     800–1200m
      // high:    1200–1800m
      // alpine:  1800m+
    }
  },

  // ── CROPS (max 8) ────────────────────────────────────────────
  crops: {
    type: [cropSchema],
    validate: {
      validator: function(crops) {
        return crops.length <= 8;
      },
      message: 'You can have a maximum of 8 crops on your farm profile'
    },
    default: []
  },

  // ── COFFEES (max 5) ──────────────────────────────────────────
  coffees: {
    type: [coffeeSchema],
    validate: {
      validator: function(coffees) {
        return coffees.length <= 5;
      },
      message: 'You can have a maximum of 5 coffee varieties on your farm profile'
    },
    default: []
  },

  // ── SOIL DATA (optional, for future sensor integration) ──────
  soilData: {
    pH: {
      type: Number,
      min: [0, 'pH must be between 0 and 14'],
      max: [14, 'pH must be between 0 and 14']
    },
    nitrogen:      { type: Number, min: 0 },
    phosphorus:    { type: Number, min: 0 },
    potassium:     { type: Number, min: 0 },
    organicMatter: {
      type: Number,
      min: [0, 'Cannot be negative'],
      max: [100, 'Must be below 100%']
    },
    lastTested: Date
  },

  // ── PREFERENCES ──────────────────────────────────────────────
  preferences: {
    language: {
      type: String,
      enum: {
        values: ['en', 'zh-TW'],
        message: 'Language must be "en" or "zh-TW"'
      },
      default: 'en'
    },
    alertsEnabled: {
      type: Boolean,
      default: true
    }
  },

  // ── PROFILE STATE ────────────────────────────────────────────
  // Track whether the user completed the setup flow
  setupComplete: {
    type: Boolean,
    default: false
    // true once: location confirmed + at least 1 crop selected
  }

}, { timestamps: true });

// ── INDEXES ──────────────────────────────────────────────────
// Only declare each index once to avoid Mongoose duplicate warnings
farmProfileSchema.index({
  'location.coordinates.lat': 1,
  'location.coordinates.lng': 1
});

// ── HELPER METHOD: compute altitude zone from elevation ───────
farmProfileSchema.methods.getAltitudeZone = function() {
  const elev = this.location?.elevation;
  if (!elev) return null;
  if (elev < 800)  return 'lowland'; // 200–800m
  if (elev < 1200) return 'mid';     // 800–1200m
  if (elev < 1800) return 'high';    // 1200–1800m
  return 'alpine';                    // 1800m+
};

// ── PRE-SAVE: auto-compute altitudeZone when elevation changes ─
farmProfileSchema.pre('save', function(next) {
  if (this.isModified('location.elevation') && this.location?.elevation != null) {
    this.location.altitudeZone = this.getAltitudeZone();
  }
  next();
});

module.exports = mongoose.model('FarmProfile', farmProfileSchema);