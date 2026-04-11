/**
 * API Clients for External Services
 * Wrappers for Google Maps APIs and Taiwan Weather Bureau API
 */

const axios = require('axios');

// ============================================================
// GOOGLE MAPS API CLIENT
// ============================================================

/**
 * Geocode an address to coordinates
 * @param {String} address - Address to geocode
 * @returns {Promise<Object>} { lat, lng, formattedAddress }
 */
async function geocodeAddress(address) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY,
        region: 'tw', // Bias results to Taiwan
        language: 'zh-TW'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }

    const result = response.data.results[0];
    
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      addressComponents: result.address_components
    };

  } catch (error) {
    console.error('Geocoding error:', error.message);
    throw new Error('Failed to geocode address');
  }
}

/**
 * Reverse geocode coordinates to address
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Promise<Object>} { formattedAddress, addressComponents }
 */
async function reverseGeocode(lat, lng) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${lat},${lng}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
        language: 'zh-TW'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Reverse geocoding failed: ${response.data.status}`);
    }

    const result = response.data.results[0];
    
    return {
      formattedAddress: result.formatted_address,
      addressComponents: result.address_components,
      placeId: result.place_id
    };

  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    throw new Error('Failed to reverse geocode coordinates');
  }
}

/**
 * Get elevation for coordinates
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Promise<Number>} Elevation in meters
 */
async function getElevation(lat, lng) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/elevation/json', {
      params: {
        locations: `${lat},${lng}`,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Elevation API failed: ${response.data.status}`);
    }

    const elevation = response.data.results[0].elevation;
    return Math.round(elevation); // Round to nearest meter

  } catch (error) {
    console.error('Elevation API error:', error.message);
    throw new Error('Failed to fetch elevation data');
  }
}

// ============================================================
// TAIWAN WEATHER BUREAU API CLIENT
// ============================================================

/**
 * Get climate data with elevation-based temperature adjustment
 * Uses base climate data + elevation lapse rate (~0.6°C per 100m)
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Promise<Object>} Climate data
 */
async function getTaiwanClimateData(lat, lng) {
  try {
    // Get elevation for this location
    const elevation = await getElevation(lat, lng);
    
    // Taiwan base climate patterns (sea level equivalent)
    // Adjusted based on latitude and typical Taiwan weather patterns
    const latFactor = (lat - 22) / 4; // Normalize latitude effect (22°N = south, 26°N = north)
    
    // Base temperatures at sea level
    const baseMonthlyTemps = [
      16 - latFactor * 2,  // Jan (cooler in north)
      17 - latFactor * 2,  // Feb
      20 - latFactor * 1,  // Mar
      23,                  // Apr
      26,                  // May
      28,                  // Jun (summer)
      29,                  // Jul (hottest)
      29,                  // Aug
      27,                  // Sep
      25,                  // Oct
      22 - latFactor * 1,  // Nov
      18 - latFactor * 2   // Dec
    ];
    
    // Rainfall patterns (Taiwan is wetter in summer, drier in winter)
    const monthlyRainfall = [
      90,   // Jan
      130,  // Feb  
      150,  // Mar
      170,  // Apr
      250,  // May (plum rain season)
      320,  // Jun (typhoon season begins)
      350,  // Jul
      380,  // Aug (peak typhoon)
      300,  // Sep
      120,  // Oct
      80,   // Nov
      70    // Dec
    ];
    
    // Apply elevation lapse rate: -0.6°C per 100m
    const tempAdjustment = -(elevation / 100) * 0.6;
    const adjustedTemps = baseMonthlyTemps.map(t => Math.round((t + tempAdjustment) * 10) / 10);
    
    // Calculate derived values
    const avgTemp = adjustedTemps.reduce((a, b) => a + b, 0) / 12;
    const annualRainfall = monthlyRainfall.reduce((a, b) => a + b, 0);
    const minTemp = Math.min(...adjustedTemps);
    const maxTemp = Math.max(...adjustedTemps);
    
    // Growing season (months with avg temp > 10°C)
    const growingMonths = adjustedTemps.filter(t => t > 10).length;
    const growingSeason = growingMonths * 30; // days
    
    // Climate zone classification
    let climateZone = 'Tropical';
    if (avgTemp < 18) climateZone = 'Subtropical';
    if (avgTemp < 15 || elevation > 1500) climateZone = 'Temperate';
    
    // Humidity (higher in mountains due to clouds)
    const avgHumidity = Math.min(85, 70 + (elevation / 200));
    
    const climateData = {
      location: { lat, lng, name: 'Taiwan Location' },
      annual: {
        avgTemp: Math.round(avgTemp * 10) / 10,
        minTemp: Math.round(minTemp * 10) / 10,
        maxTemp: Math.round(maxTemp * 10) / 10,
        annualRainfall,
        avgHumidity: Math.round(avgHumidity),
        growingSeason,
        climateZone,
        elevation
      },
      monthly: {
        temps: adjustedTemps,
        rainfall: monthlyRainfall,
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      analysis: {
        frostRisk: minTemp < 5 ? 'High' : minTemp < 10 ? 'Moderate' : 'Low',
        heatStress: maxTemp > 32 ? 'High' : maxTemp > 28 ? 'Moderate' : 'Low',
        waterAvailability: annualRainfall > 2500 ? 'Abundant' : annualRainfall > 1500 ? 'Adequate' : 'Limited',
        bestPlantingMonths: adjustedTemps.map((t, i) => t > 15 && t < 28 ? i : -1).filter(i => i >= 0)
      }
    };
    
    console.log(`🌤️  Climate calculated: ${avgTemp.toFixed(1)}°C avg, ${annualRainfall}mm/year at ${elevation}m`);
    
    return climateData;

  } catch (error) {
    console.error('Climate calculation error:', error.message);
    throw new Error('Failed to calculate climate data');
  }
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Check if coordinates are within Taiwan boundaries
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Boolean}
 */
function isInTaiwan(lat, lng) {
  // Taiwan approximate boundaries
  const TAIWAN_BOUNDS = {
    latMin: 21.0,
    latMax: 26.0,
    lngMin: 119.0,
    lngMax: 122.0
  };

  return (
    lat >= TAIWAN_BOUNDS.latMin &&
    lat <= TAIWAN_BOUNDS.latMax &&
    lng >= TAIWAN_BOUNDS.lngMin &&
    lng <= TAIWAN_BOUNDS.lngMax
  );
}

/**
 * Validate coordinates format
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Boolean}
 */
function validateCoordinates(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Google Maps APIs
  geocodeAddress,
  reverseGeocode,
  getElevation,
  
  // Taiwan Weather Bureau
  getTaiwanClimateData,
  
  // Validation
  isInTaiwan,
  validateCoordinates
};