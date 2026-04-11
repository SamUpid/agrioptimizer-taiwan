/**
 * Crops Controller
 * Handles crop recommendations based on location/climate
 */
const Crop = require('../models/Crop');
const Location = require('../models/Location');
const CompanionCrop = require('../models/CompanionCrop');
const { getTopSuitableCrops, calculateSuitability } = require('../utils/suitability');

// Show crop recommendations page
exports.showCropsPage = async (req, res) => {
  try {
    // Check if location and climate data exist in session
    const location = req.session.location;
    
    if (!location || !location.lat || !location.lng) {
      req.flash('error', 'Please select your farm location first');
      return res.redirect('/location');
    }

    // Get cached climate data
    const dbLocation = await Location.findByCoordinates(location.lat, location.lng, 0.01);
    
    if (!dbLocation || !dbLocation.climateData) {
      req.flash('error', 'Please view climate data first');
      return res.redirect('/climate');
    }

    // Get search query
    const search = req.query.search || '';
    
    // Build search query
    let query = {};
    if (search) {
      query.$or = [
        { name_en: { $regex: search, $options: 'i' } },
        { name_zh: { $regex: search, $options: 'i' } }
      ];
    }

    // Get all crops (with search filter if present)
    const allCrops = await Crop.find(query);

    // If search returns no results, show message
    if (search && allCrops.length === 0) {
      req.flash('info', `No crops found matching "${search}"`);
    }

    // Prepare climate data for algorithm
    const climate = {
      avgTemp: dbLocation.climateData.annualTemp,
      minTemp: Math.min(...dbLocation.climateData.monthlyTemps),
      maxTemp: Math.max(...dbLocation.climateData.monthlyTemps),
      annualRainfall: dbLocation.climateData.annualRainfall
    };

    // Calculate suitability for all crops
    const recommendedCrops = getTopSuitableCrops(
      allCrops, 
      climate, 
      location.elevation || 0, 
      30
    );

    // Get filters from query
    const category = req.query.category || 'all';
    const sortBy = req.query.sort || 'suitability';

    // Filter by category
    let filteredCrops = recommendedCrops;
    if (category !== 'all') {
      filteredCrops = recommendedCrops.filter(
        c => c.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Sort
    if (sortBy === 'roi') {
      filteredCrops.sort((a, b) => b.roiPercentage - a.roiPercentage);
    } else if (sortBy === 'price') {
      filteredCrops.sort((a, b) => b.pricePerKg - a.pricePerKg);
    }
    // Default is already sorted by suitability

    res.render('crops', {
      title: 'Crop Recommendations',
      page: 'crops',
      location,
      climate,
      crops: filteredCrops.slice(0, 12), // Top 12 for display
      topCrops: filteredCrops.slice(0, 3), // Top 3 featured
      category,
      sortBy,
      search, // Pass search query to view
      categories: ['all', 'Fruit', 'Vegetable', 'Herb', 'Specialty']
    });

  } catch (error) {
    console.error('Error rendering crops page:', error);
    req.flash('error', 'Failed to load crop recommendations');
    res.status(500).render('error', {
      title: 'Error',
      page: 'error',
      message: 'Failed to load crop recommendations',
      error: { status: 500, stack: error.stack }
    });
  }
};

// Show single crop detail
exports.showCropDetail = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    
    if (!crop) {
      req.flash('error', 'Crop not found');
      return res.status(404).render('error', {
        title: 'Not Found',
        page: 'error',
        message: 'Crop not found',
        error: { status: 404 }
      });
    }

    const location = req.session.location;
    let suitability = null;

    // Calculate suitability if location available
    if (location) {
      const dbLocation = await Location.findByCoordinates(
        location.lat, 
        location.lng, 
        0.01
      );
      
      if (dbLocation && dbLocation.climateData) {
        const climate = {
          avgTemp: dbLocation.climateData.annualTemp,
          minTemp: Math.min(...dbLocation.climateData.monthlyTemps),
          maxTemp: Math.max(...dbLocation.climateData.monthlyTemps),
          annualRainfall: dbLocation.climateData.annualRainfall
        };

        suitability = calculateSuitability(
          climate, 
          location.elevation || 0, 
          crop
        );
      }
    }

    // Fetch companion crops
    let companions = [];
    try {
      const companionRecords = await CompanionCrop.find({
        $or: [
          { primaryCropId: crop._id },
          { companionCropId: crop._id }
        ]
      })
        .populate('primaryCropId companionCropId')
        .sort({ compatibilityScore: -1 });

      // Format companion data
      companions = companionRecords.map(comp => {
        const isPrimary = comp.primaryCropId._id.toString() === crop._id.toString();
        const companion = isPrimary ? comp.companionCropId : comp.primaryCropId;
        return {
          crop: {
            id: companion._id,
            name_en: companion.name_en,
            name_zh: companion.name_zh,
            category: companion.category,
            imageUrl: companion.imageUrl
          },
          compatibilityScore: comp.compatibilityScore,
          benefits: comp.benefits_en ? [comp.benefits_en] : [],
          plantingNotes: comp.plantingTimingNotes || comp.plantingNotes || '',
          spacing: comp.spacingRecommendation || comp.spacing || ''
        };
      });
    } catch (err) {
      console.error('Error fetching companions:', err);
      // Continue without companions if fetch fails
    }

    res.render('cropDetail', {
      title: crop.name_en,
      page: 'crops',
      crop,
      suitability,
      location,
      companions
    });

  } catch (error) {
    console.error('Error rendering crop detail:', error);
    req.flash('error', 'Failed to load crop details');
    res.status(500).render('error', {
      title: 'Error',
      page: 'error',
      message: 'Failed to load crop details',
      error: { status: 500, stack: error.stack }
    });
  }
};