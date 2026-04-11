/**
 * Coffee Controller
 * Handles specialty coffee variety recommendations
 */

const CoffeeVariety = require('../models/CoffeeVariety');
const Location = require('../models/Location');

// Show coffee varieties page
exports.showCoffeePage = async (req, res) => {
  try {
    // Check if location exists in session
    const location = req.session.location;
    
    if (!location || !location.lat || !location.lng) {
      req.session.error = 'Please select your farm location first';
      return res.redirect('/location');
    }

    // Get cached climate data
    const dbLocation = await Location.findByCoordinates(location.lat, location.lng, 0.01);
    
    if (!dbLocation || !dbLocation.climateData) {
      req.session.error = 'Please view climate data first';
      return res.redirect('/climate');
    }

    // Get all coffee varieties
    const allCoffee = await CoffeeVariety.find({});

    // Calculate suitability for each variety
    const coffeeSuitability = allCoffee.map(coffee => {
      const elevation = location.elevation || 0;
      const avgTemp = dbLocation.climateData.annualTemp;
      const annualRainfall = dbLocation.climateData.annualRainfall;

      // Elevation match (most critical for coffee)
      let elevationScore = 0;
      if (elevation >= coffee.optimalElevationMin && elevation <= coffee.optimalElevationMax) {
        const range = coffee.optimalElevationMax - coffee.optimalElevationMin;
        const optimal = (coffee.optimalElevationMin + coffee.optimalElevationMax) / 2;
        const deviation = Math.abs(elevation - optimal);
        elevationScore = Math.max(70, 100 - (deviation / range) * 30);
      } else if (elevation < coffee.optimalElevationMin) {
        const deficit = coffee.optimalElevationMin - elevation;
        elevationScore = Math.max(0, 100 - deficit / 10);
      } else {
        const excess = elevation - coffee.optimalElevationMax;
        elevationScore = Math.max(0, 100 - excess / 10);
      }

      // Temperature suitability
      const tempMin = coffee.tempMin || 15;
      const tempMax = coffee.tempMax || 28;
      let tempScore = 0;
      if (avgTemp >= tempMin && avgTemp <= tempMax) {
        const optimal = (tempMin + tempMax) / 2;
        const deviation = Math.abs(avgTemp - optimal);
        tempScore = Math.max(70, 100 - deviation * 5);
      } else {
        tempScore = Math.max(0, 50 - Math.abs(avgTemp - tempMin) * 3);
      }

      // Rainfall suitability
      const rainfallMin = coffee.rainfallMin || 1200;
      const rainfallMax = coffee.rainfallMax || 2500;
      let rainfallScore = 0;
      if (annualRainfall >= rainfallMin && annualRainfall <= rainfallMax) {
        rainfallScore = 90;
      } else if (annualRainfall < rainfallMin) {
        const deficit = rainfallMin - annualRainfall;
        rainfallScore = Math.max(0, 90 - deficit / 10);
      } else {
        const excess = annualRainfall - rainfallMax;
        rainfallScore = Math.max(0, 90 - excess / 15);
      }

      // Quality potential (elevation-based)
      let qualityPotential = 'Good';
      if (elevation >= 1200) qualityPotential = 'Excellent (Specialty Grade)';
      else if (elevation >= 800) qualityPotential = 'Very Good (Premium)';
      else if (elevation >= 500) qualityPotential = 'Good (Commercial)';
      else qualityPotential = 'Fair (Standard)';

      // Overall score (elevation weighted 50%, temp 30%, rainfall 20%)
      const overallScore = Math.round(
        elevationScore * 0.5 +
        tempScore * 0.3 +
        rainfallScore * 0.2
      );

      let recommendation = 'Not Recommended';
      let color = 'danger';
      if (overallScore >= 80) { recommendation = 'Highly Suitable'; color = 'success'; }
      else if (overallScore >= 65) { recommendation = 'Suitable'; color = 'success'; }
      else if (overallScore >= 50) { recommendation = 'Challenging'; color = 'warning'; }

      return {
        ...coffee.toObject(),
        suitability: {
          score: overallScore,
          recommendation,
          color,
          breakdown: {
            elevation: Math.round(elevationScore),
            temperature: Math.round(tempScore),
            rainfall: Math.round(rainfallScore)
          },
          qualityPotential
        }
      };
    });

    // Sort by score
    coffeeSuitability.sort((a, b) => b.suitability.score - a.suitability.score);

    res.render('coffee', {
      title: 'Coffee Varieties',
      page: 'coffee',
      location,
      climate: {
        avgTemp: dbLocation.climateData.annualTemp,
        annualRainfall: dbLocation.climateData.annualRainfall
      },
      coffeeVarieties: coffeeSuitability,
      topVariety: coffeeSuitability[0]
    });

  } catch (error) {
    console.error('Error rendering coffee page:', error);
    res.status(500).render('error', {
      title: 'Error',
      page: 'error',
      message: 'Failed to load coffee varieties',
      error: { status: 500, stack: error.stack }
    });
  }
};

// Show single coffee variety detail
exports.showCoffeeDetail = async (req, res) => {
  try {
    const coffee = await CoffeeVariety.findById(req.params.id);
    
    if (!coffee) {
      return res.status(404).render('error', {
        title: 'Not Found',
        page: 'error',
        message: 'Coffee variety not found',
        error: { status: 404 }
      });
    }

    const location = req.session.location;
    let suitability = null;

    // Calculate suitability if location available
    if (location) {
      const dbLocation = await Location.findByCoordinates(location.lat, location.lng, 0.01);
      if (dbLocation && dbLocation.climateData) {
        const elevation = location.elevation || 0;
        const avgTemp = dbLocation.climateData.annualTemp;
        
        // Simple elevation-based suitability
        let elevationScore = 0;
        if (elevation >= coffee.optimalElevationMin && elevation <= coffee.optimalElevationMax) {
          elevationScore = 90;
        } else if (elevation < coffee.optimalElevationMin) {
          elevationScore = Math.max(0, 100 - (coffee.optimalElevationMin - elevation) / 10);
        }
        
        let qualityPotential = 'Good';
        if (elevation >= 1200) qualityPotential = 'Excellent (Specialty Grade)';
        else if (elevation >= 800) qualityPotential = 'Very Good (Premium)';
        
        suitability = {
          score: elevationScore,
          qualityPotential,
          elevation: Math.round(elevationScore)
        };
      }
    }

    res.render('coffeeDetail', {
      title: coffee.varietyName,
      page: 'coffee',
      coffee,
      suitability,
      location
    });

  } catch (error) {
    console.error('Error rendering coffee detail:', error);
    res.status(500).render('error', {
      title: 'Error',
      page: 'error',
      message: 'Failed to load coffee details',
      error: { status: 500, stack: error.stack }
    });
  }
};