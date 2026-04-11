/**
 * Crop Comparison Tool
 * Compare 2-3 crops side-by-side
 */

const Crop = require('../models/Crop');

exports.showComparison = async (req, res) => {
  try {
    const cropIds = req.query.crops ? req.query.crops.split(',') : [];
    
    if (cropIds.length === 0) {
      // Show selection page
      const allCrops = await Crop.find({}).sort({ name_en: 1 });
      return res.render('compare', {
        title: 'Compare Crops',
        page: 'compare',
        allCrops,
        selectedCrops: [],
        isComparing: false
      });
    }

    // Get selected crops
    const selectedCrops = await Crop.find({
      _id: { $in: cropIds }
    });

    // Get location for suitability
    const location = req.session.location;
    let climate = null;
    
    if (location) {
      const Location = require('../models/Location');
      const dbLocation = await Location.findByCoordinates(location.lat, location.lng, 0.01);
      if (dbLocation && dbLocation.climateData) {
        climate = {
          avgTemp: dbLocation.climateData.annualTemp,
          minTemp: Math.min(...dbLocation.climateData.monthlyTemps),
          maxTemp: Math.max(...dbLocation.climateData.monthlyTemps),
          annualRainfall: dbLocation.climateData.annualRainfall
        };
      }
    }

    // Calculate suitability for each
    const { calculateSuitability } = require('../utils/suitability');
    const cropsWithSuitability = selectedCrops.map(crop => {
      let suitability = null;
      if (climate && location) {
        suitability = calculateSuitability(climate, location.elevation || 0, crop);
      }
      return {
        ...crop.toObject(),
        suitability
      };
    });

    const allCrops = await Crop.find({}).sort({ name_en: 1 });

    res.render('compare', {
      title: 'Compare Crops',
      page: 'compare',
      allCrops,
      selectedCrops: cropsWithSuitability,
      isComparing: true,
      location
    });

  } catch (error) {
    console.error('Error comparing crops:', error);
    res.status(500).render('error', {
      title: 'Error',
      page: 'error',
      message: 'Failed to compare crops',
      error: { status: 500, stack: error.stack }
    });
  }
};

module.exports = {
  showComparison
};