/**
 * Climate Controller - FIXED with URL parameter support
 * Handles climate data fetching and visualization
 */

const Location = require('../models/Location');
const { getTaiwanClimateData, isInTaiwan } = require('../utils/apiClients');

// ============================================================
// RENDER CLIMATE PAGE
// ============================================================

exports.showClimatePage = async (req, res) => {
  try {
    console.log('=== CLIMATE PAGE REQUEST ===');
    console.log('Query params:', req.query);
    console.log('Session location:', req.session.location);
    console.log('Session ID:', req.sessionID);
    
    let location = null;
    
    // PRIORITY 1: Check URL query parameters (from our location.ejs fix)
    if (req.query.lat && req.query.lng) {
      console.log('✅ Using location from URL parameters');
      location = {
        lat: parseFloat(req.query.lat),
        lng: parseFloat(req.query.lng),
        elevation: req.query.elev ? parseFloat(req.query.elev) : null,
        address: req.query.address || 'Selected Location',
        savedAt: new Date()
      };
      
      // Also save to session for future use
      req.session.location = location;
      await new Promise((resolve) => req.session.save(resolve));
      console.log('Saved URL location to session');
    }
    
    // PRIORITY 2: Check session
    if (!location && req.session.location && req.session.location.lat && req.session.location.lng) {
      console.log('✅ Using location from session');
      location = req.session.location;
    }
    
    // PRIORITY 3: Check for location in request body (POST)
    if (!location && req.body && req.body.lat && req.body.lng) {
      console.log('✅ Using location from POST body');
      location = {
        lat: parseFloat(req.body.lat),
        lng: parseFloat(req.body.lng),
        elevation: req.body.elev ? parseFloat(req.body.elev) : null,
        address: req.body.address || 'Selected Location',
        savedAt: new Date()
      };
      
      // Save to session
      req.session.location = location;
      await new Promise((resolve) => req.session.save(resolve));
    }
    
    // If no location found, redirect to location page
    if (!location || !location.lat || !location.lng) {
      console.log('❌ No location found in URL, session, or body');
      req.flash('error', 'Please select your farm location first');
      return res.redirect('/location');
    }
    
    console.log('📍 Using location:', {
      lat: location.lat,
      lng: location.lng,
      elevation: location.elevation
    });

    // Try to get cached climate data from DB
    let dbLocation = await Location.findByCoordinates(location.lat, location.lng, 0.01);

    let climateData;

    // If no cache or expired, fetch fresh data
    if (!dbLocation || !dbLocation.isCacheValid) {
      console.log('📡 Fetching fresh climate data...');
      
      const freshData = await getTaiwanClimateData(location.lat, location.lng);
      
      // Transform data to match Location model schema
      const transformedData = {
        annualTemp: freshData.annual.avgTemp,
        annualRainfall: freshData.annual.annualRainfall,
        avgHumidity: freshData.annual.avgHumidity,
        growingSeason: freshData.annual.growingSeason,
        monthlyTemps: freshData.monthly.temps,
        monthlyRainfall: freshData.monthly.rainfall
      };
      
      // Save to DB for caching
      if (dbLocation) {
        // Update existing
        dbLocation.climateData = transformedData;
        dbLocation.lastUpdated = new Date();
        await dbLocation.save();
      } else {
        // Create new
        dbLocation = new Location({
          latitude: location.lat,
          longitude: location.lng,
          elevation: location.elevation || 0,
          locationName: location.address || 'Taiwan Location',
          climateData: transformedData,
          lastUpdated: new Date()
        });
        await dbLocation.save();
      }
      
      // Use the fresh data for rendering (with full structure)
      climateData = freshData;
      
    } else {
      console.log('💾 Using cached climate data');
      
      // Reconstruct full climate data from cached DB data
      const cached = dbLocation.climateData;
      climateData = {
        location: { lat: location.lat, lng: location.lng, name: location.address },
        annual: {
          avgTemp: cached.annualTemp,
          minTemp: Math.min(...cached.monthlyTemps),
          maxTemp: Math.max(...cached.monthlyTemps),
          annualRainfall: cached.annualRainfall,
          avgHumidity: cached.avgHumidity,
          growingSeason: cached.growingSeason,
          climateZone: cached.annualTemp < 15 ? 'Temperate' : cached.annualTemp < 18 ? 'Subtropical' : 'Tropical',
          elevation: location.elevation || 0
        },
        monthly: {
          temps: cached.monthlyTemps,
          rainfall: cached.monthlyRainfall,
          months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        },
        analysis: {
          frostRisk: Math.min(...cached.monthlyTemps) < 5 ? 'High' : Math.min(...cached.monthlyTemps) < 10 ? 'Moderate' : 'Low',
          heatStress: Math.max(...cached.monthlyTemps) > 32 ? 'High' : Math.max(...cached.monthlyTemps) > 28 ? 'Moderate' : 'Low',
          waterAvailability: cached.annualRainfall > 2500 ? 'Abundant' : cached.annualRainfall > 1500 ? 'Adequate' : 'Limited',
          bestPlantingMonths: cached.monthlyTemps.map((t, i) => t > 15 && t < 28 ? i : -1).filter(i => i >= 0)
        }
      };
    }

    console.log('✅ Rendering climate page with data');
    
    res.render('climate', {
      title: res.__('climate.title') || 'Climate Data',
      page: 'climate',
      location,
      climateData,
      elevation: location.elevation || 0,
      pageScripts: `<script>
        window.climateData = {
          months: ${JSON.stringify(climateData.monthly.months)},
          temps: ${JSON.stringify(climateData.monthly.temps)},
          rainfall: ${JSON.stringify(climateData.monthly.rainfall)},
          minTemp: ${JSON.stringify(climateData.annual.minTemp)},
          maxTemp: ${JSON.stringify(climateData.annual.maxTemp)}
        };
        console.log('✅ Chart data loaded:', window.climateData);
        console.log('📍 Location from URL/session:', ${JSON.stringify(location)});
      </script>`
    });

  } catch (error) {
    console.error('Error rendering climate page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load climate data: ' + error.message,
      error: error
    });
  }
};

// ============================================================
// API: GET CLIMATE DATA
// ============================================================

exports.getClimateData = async (req, res) => {
  try {
    // Check URL params first, then session
    let location = null;
    
    if (req.query.lat && req.query.lng) {
      location = {
        lat: parseFloat(req.query.lat),
        lng: parseFloat(req.query.lng),
        elevation: req.query.elev ? parseFloat(req.query.elev) : null
      };
    } else if (req.session.location) {
      location = req.session.location;
    }
    
    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({
        success: false,
        message: 'No location provided. Please select a location first.'
      });
    }

    let dbLocation = await Location.findByCoordinates(location.lat, location.lng, 0.01);

    if (!dbLocation || !dbLocation.isCacheValid) {
      const freshData = await getTaiwanClimateData(location.lat, location.lng);
      
      // Transform for DB
      const transformedData = {
        annualTemp: freshData.annual.avgTemp,
        annualRainfall: freshData.annual.annualRainfall,
        avgHumidity: freshData.annual.avgHumidity,
        growingSeason: freshData.annual.growingSeason,
        monthlyTemps: freshData.monthly.temps,
        monthlyRainfall: freshData.monthly.rainfall
      };
      
      if (dbLocation) {
        dbLocation.climateData = transformedData;
        dbLocation.lastUpdated = new Date();
        await dbLocation.save();
      } else {
        dbLocation = new Location({
          latitude: location.lat,
          longitude: location.lng,
          elevation: location.elevation || 0,
          locationName: location.address || 'Taiwan Location',
          climateData: transformedData
        });
        await dbLocation.save();
      }

      return res.json({
        success: true,
        cached: false,
        data: freshData
      });
    }

    // Return cached data (reconstruct full structure)
    const cached = dbLocation.climateData;
    const fullData = {
      location: { lat: location.lat, lng: location.lng, name: location.address },
      annual: {
        avgTemp: cached.annualTemp,
        annualRainfall: cached.annualRainfall,
        avgHumidity: cached.avgHumidity,
        growingSeason: cached.growingSeason
      },
      monthly: {
        temps: cached.monthlyTemps,
        rainfall: cached.monthlyRainfall
      }
    };

    res.json({
      success: true,
      cached: true,
      data: fullData
    });

  } catch (error) {
    console.error('Get climate data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch climate data',
      error: error.message
    });
  }
};