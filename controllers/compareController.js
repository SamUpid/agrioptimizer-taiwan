/**
 * Crop Comparison Controller
 */

const Crop = require('../models/Crop');
const Location = require('../models/Location');
const { calculateSuitability } = require('../utils/suitability');

exports.showComparison = async (req, res) => {
  try {
    const cropIds = req.query.crops ? req.query.crops.split(',').filter(id => id) : [];
    
    // Get all crops for selection
    const allCrops = await Crop.find({}).sort({ name_en: 1 });

    if (cropIds.length === 0) {
      // Show selection page
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

    // Get location and climate for suitability
    const location = req.session.location;
    let climate = null;
    
    if (location) {
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

    // Calculate suitability and ROI for each
    const cropsWithMetrics = selectedCrops.map(crop => {
      let suitability = null;
      if (climate && location) {
        suitability = calculateSuitability(climate, location.elevation || 0, crop);
      }

      const avgPrice = (crop.marketPriceMin + crop.marketPriceMax) / 2;
      const revenue = crop.expectedYield * avgPrice;
      const roi = ((revenue - crop.operatingCost) / crop.initialInvestment * 100).toFixed(1);

      return {
        ...crop.toObject(),
        suitability,
        roi: parseFloat(roi),
        avgPrice
      };
    });

    res.render('compare', {
      title: 'Compare Crops',
      page: 'compare',
      allCrops,
      selectedCrops: cropsWithMetrics,
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