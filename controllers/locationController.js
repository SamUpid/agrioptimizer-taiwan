/**
 * Location Controller
 * Handles location-related requests and coordinates with external APIs
 */

const Location = require('../models/Location');
const {
  geocodeAddress,
  reverseGeocode,
  getElevation,
  getTaiwanClimateData,
  isInTaiwan,
  validateCoordinates
} = require('../utils/apiClients');

// ============================================================
// RENDER LOCATION PAGE
// ============================================================

/**
 * GET /location - Render location selection page
 */
exports.showLocationPage = async (req, res) => {
  try {
    
    // [DEBUG] Get API key and log status
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    console.log('=== LOCATION PAGE DEBUG ===');
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('API Key first 5 chars:', apiKey ? apiKey.substring(0, 5) : 'none');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('===========================');
    const savedLocation = req.session.location || null;
    
    // Create page-specific scripts
    const pageScripts = `
      <script src="/js/maps.js"></script>
      <script async defer src="https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap&language=${res.getLocale() === 'zh-TW' ? 'zh-TW' : 'en'}"></script>
    `;

    res.render('location', {
      title: res.__('location.title'),
      page: 'location',
      savedLocation: savedLocation,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      pageScripts: pageScripts
    });

  } catch (error) {
    console.error('Error rendering location page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load location page',
      error: error
    });
  }
};

// ============================================================
// GEOCODE ADDRESS
// ============================================================

/**
 * POST /location/geocode - Convert address to coordinates
 */
exports.geocode = async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || address.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    // Geocode the address
    const result = await geocodeAddress(address);

    // Check if location is in Taiwan
    if (!isInTaiwan(result.lat, result.lng)) {
      return res.status(400).json({
        success: false,
        message: 'Location must be in Taiwan (台灣)',
        data: result
      });
    }

    // Get elevation
    const elevation = await getElevation(result.lat, result.lng);

    res.json({
      success: true,
      data: {
        lat: result.lat,
        lng: result.lng,
        address: result.formattedAddress,
        elevation: elevation
      }
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to geocode address',
      error: error.message
    });
  }
};

// ============================================================
// REVERSE GEOCODE
// ============================================================

/**
 * POST /location/reverse-geocode - Convert coordinates to address
 */
exports.reverseGeocodeCoords = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    // Validate coordinates
    if (!validateCoordinates(parseFloat(lat), parseFloat(lng))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Check if in Taiwan
    if (!isInTaiwan(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Location must be in Taiwan (台灣)'
      });
    }

    // Reverse geocode
    const result = await reverseGeocode(latitude, longitude);

    res.json({
      success: true,
      data: {
        address: result.formattedAddress
      }
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse geocode coordinates',
      error: error.message
    });
  }
};

// ============================================================
// GET ELEVATION
// ============================================================

/**
 * POST /location/fetch-elevation - Get elevation for coordinates
 */
exports.fetchElevation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    // Validate coordinates
    if (!validateCoordinates(parseFloat(lat), parseFloat(lng))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Check if in Taiwan
    if (!isInTaiwan(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Location must be in Taiwan (台灣)'
      });
    }

    // Get elevation
    const elevation = await getElevation(latitude, longitude);

    res.json({
      success: true,
      data: {
        elevation: elevation
      }
    });

  } catch (error) {
    console.error('Elevation fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch elevation',
      error: error.message
    });
  }
};

// ============================================================
// SAVE LOCATION
// ============================================================

/**
 * POST /location/save - Save location to session and optionally to database
 */
exports.saveLocation = async (req, res) => {
  try {
    const { lat, lng, address, elevation } = req.body;

    // Validate required fields
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Validate coordinates
    if (!validateCoordinates(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    // Check if in Taiwan
    if (!isInTaiwan(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Location must be in Taiwan (台灣)'
      });
    }

    // If elevation not provided, fetch it
    let finalElevation = elevation ? parseFloat(elevation) : null;
    if (!finalElevation) {
      finalElevation = await getElevation(latitude, longitude);
    }

    // If address not provided, reverse geocode
    let finalAddress = address || null;
    if (!finalAddress) {
      const geocodeResult = await reverseGeocode(latitude, longitude);
      finalAddress = geocodeResult.formattedAddress;
    }

    // Save to session
    req.session.location = {
      lat: latitude,
      lng: longitude,
      address: finalAddress,
      elevation: finalElevation,
      savedAt: new Date()
    };

    // Optional: Check if location exists in database (cached climate data)
    let dbLocation = await Location.findByCoordinates(latitude, longitude, 0.01);

    res.json({
      success: true,
      message: 'Location saved successfully',
      data: {
        lat: latitude,
        lng: longitude,
        address: finalAddress,
        elevation: finalElevation,
        hasClimateData: dbLocation ? dbLocation.isCacheValid : false
      }
    });

  } catch (error) {
    console.error('Save location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save location',
      error: error.message
    });
  }
};

// ============================================================
// GET CLIMATE DATA (Placeholder for Day 4)
// ============================================================

/**
 * POST /location/fetch-climate - Get climate data for location
 * This will be fully implemented on Day 4
 */
exports.fetchClimateData = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    // Validate coordinates
    if (!validateCoordinates(parseFloat(lat), parseFloat(lng))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Check if in Taiwan
    if (!isInTaiwan(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Location must be in Taiwan (台灣)'
      });
    }

    // Check if we have cached data
    let location = await Location.findByCoordinates(latitude, longitude, 0.01);

    if (location && location.isCacheValid) {
      // Return cached data
      return res.json({
        success: true,
        cached: true,
        data: location
      });
    }

    // Fetch fresh climate data (placeholder - will implement on Day 4)
    const climateData = await getTaiwanClimateData(latitude, longitude);

    res.json({
      success: true,
      cached: false,
      message: 'Using mock climate data - Taiwan Weather Bureau API to be implemented',
      data: climateData
    });

  } catch (error) {
    console.error('Fetch climate data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch climate data',
      error: error.message
    });
  }
};

// ============================================================
// CLEAR LOCATION
// ============================================================

/**
 * POST /location/clear - Clear location from session
 */
exports.clearLocation = async (req, res) => {
  try {
    req.session.location = null;

    res.json({
      success: true,
      message: 'Location cleared successfully'
    });

  } catch (error) {
    console.error('Clear location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear location',
      error: error.message
    });
  }
};

// ============================================================
// GET CURRENT LOCATION FROM SESSION
// ============================================================

/**
 * GET /location/current - Get location from session
 */
exports.getCurrentLocation = async (req, res) => {
  try {
    const location = req.session.location || null;

    if (!location) {
      return res.json({
        success: true,
        hasLocation: false,
        data: null
      });
    }

    res.json({
      success: true,
      hasLocation: true,
      data: location
    });

  } catch (error) {
    console.error('Get current location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current location',
      error: error.message
    });
  }
};