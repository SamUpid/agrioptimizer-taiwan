/**
 * Test Models and Data
 * Verifies that all models and seeded data are working correctly
 * Usage: node init/testModels.js
 */

require('dotenv').config();
const { connectDB } = require('../config/database');
const { Crop, Location, CoffeeVariety, CompanionCrop } = require('../models');

// ============================================================
// TEST FUNCTIONS
// ============================================================

async function testCrops() {
  console.log('\n🌾 Testing Crop Model...');
  console.log('─'.repeat(60));
  
  // Count total crops
  const totalCrops = await Crop.countDocuments();
  console.log(`✅ Total crops in database: ${totalCrops}`);
  
  // Get crops by category
  const categories = ['fruit', 'vegetable', 'specialty', 'herb'];
  for (const category of categories) {
    const count = await Crop.countDocuments({ category });
    console.log(`   ${category}: ${count} crops`);
  }
  
  // Test finding suitable crops for sample climate
  console.log('\n📍 Testing suitability for sample location (1000m, 20°C, 1500mm rain):');
  const suitableCrops = await Crop.findSuitableCrops({
    avgTemp: 20,
    annualRainfall: 1500,
    elevation: 1000
  });
  console.log(`   Found ${suitableCrops.length} suitable crops`);
  if (suitableCrops.length > 0) {
    console.log(`   Examples: ${suitableCrops.slice(0, 3).map(c => c.name_en).join(', ')}`);
  }
  
  // Test virtual fields
  const coffee = await Crop.findOne({ name_en: 'Coffee (Arabica)' });
  if (coffee) {
    console.log('\n☕ Coffee (Arabica) Details:');
    console.log(`   Average market price: NT$${coffee.avgMarketPrice}/kg`);
    console.log(`   Potential revenue: NT$${coffee.potentialRevenue.toLocaleString()}/ha`);
    console.log(`   Annual profit: NT$${coffee.annualProfit.toLocaleString()}/ha`);
    console.log(`   Temperature range: ${coffee.tempRange}`);
    console.log(`   Difficulty: ${coffee.difficultyLevel} ${coffee.difficultyEmoji}`);
  }
  
  // Test 5-year projection
  if (coffee) {
    console.log('\n💰 5-Year Projection for Coffee (1 hectare):');
    const projection = coffee.calculateFiveYearProjection(1);
    projection.years.forEach(year => {
      console.log(`   Year ${year.year}: Revenue NT$${year.revenue.toLocaleString()}, Profit NT$${year.profit.toLocaleString()}`);
    });
    console.log(`   Total 5-year profit: NT$${projection.totalProfit.toLocaleString()}`);
  }
}

async function testCoffeeVarieties() {
  console.log('\n\n☕ Testing Coffee Variety Model...');
  console.log('─'.repeat(60));
  
  // Count total varieties
  const totalVarieties = await CoffeeVariety.countDocuments();
  console.log(`✅ Total coffee varieties in database: ${totalVarieties}`);
  
  // Find varieties for Taiwan mountains (1000m)
  const taiwanVarieties = await CoffeeVariety.findByElevation(1000);
  console.log(`\n📍 Suitable for 1000m elevation: ${taiwanVarieties.length} varieties`);
  taiwanVarieties.forEach(v => {
    console.log(`   ${v.varietyName}: ${v.cupQualityMin}-${v.cupQualityMax} SCAA (${v.qualityGrade})`);
  });
  
  // Test disease resistance
  const resistant = await CoffeeVariety.findDiseaseResistant();
  console.log(`\n🛡️  High disease resistance: ${resistant.length} varieties`);
  if (resistant.length > 0) {
    console.log(`   ${resistant.map(v => v.varietyName).join(', ')}`);
  }
  
  // Test virtual fields
  const geisha = await CoffeeVariety.findOne({ varietyName: 'Geisha (Gesha)' });
  if (geisha) {
    console.log('\n🏆 Geisha Variety Details:');
    console.log(`   Elevation range: ${geisha.elevationRange}`);
    console.log(`   Average cup quality: ${geisha.avgCupQuality} SCAA`);
    console.log(`   Quality grade: ${geisha.qualityGrade}`);
    console.log(`   Yield per hectare: ${geisha.yieldPerHectare} kg`);
    console.log(`   Disease resistance: ${geisha.diseaseResistance} ${geisha.diseaseResistanceEmoji}`);
    
    // Calculate annual income at NT$800/kg
    const income = geisha.calculateAnnualIncome(800);
    console.log(`   Estimated income (NT$800/kg): NT$${income.toLocaleString()}/ha/year`);
  }
}

async function testCompanionCrops() {
  console.log('\n\n🌿 Testing Companion Crop Model...');
  console.log('─'.repeat(60));
  
  // Count total relationships
  const totalRelationships = await CompanionCrop.countDocuments();
  console.log(`✅ Total companion relationships in database: ${totalRelationships}`);
  
  // Find companion for coffee
  const coffee = await Crop.findOne({ name_en: 'Coffee (Arabica)' });
  if (coffee) {
    const companions = await CompanionCrop.findCompanionsFor(coffee._id);
    console.log(`\n☕ Companions for Coffee: ${companions.length} found`);
    
    for (const comp of companions) {
      console.log(`   ${comp.companionCropId.name_en}:`);
      console.log(`      Score: ${comp.compatibilityScore}/100 ${comp.compatibilityEmoji}`);
      console.log(`      Arrangement: ${comp.spatialArrangement}`);
      console.log(`      Benefits: ${comp.benefitCount} agronomic benefits`);
      if (comp.additionalIncome) {
        console.log(`      💰 Provides additional income`);
      }
    }
    
    // Test companion stats
    const stats = await CompanionCrop.getCompanionStats(coffee._id);
    console.log('\n📊 Coffee Companion Statistics:');
    console.log(`   Total companions: ${stats.totalCompanions}`);
    console.log(`   Excellent pairings (90+): ${stats.excellentCompanions}`);
    console.log(`   Good pairings (60+): ${stats.goodCompanions}`);
    console.log(`   Nitrogen fixers: ${stats.nitrogenFixers}`);
    console.log(`   Pest controllers: ${stats.pestControllers}`);
    console.log(`   Average compatibility: ${Math.round(stats.avgCompatibility)}/100`);
  }
  
  // Find best overall companions
  const allRelationships = await CompanionCrop.find({})
    .populate('primaryCropId companionCropId')
    .sort({ compatibilityScore: -1 })
    .limit(3);
  
  console.log('\n🏆 Top 3 Companion Pairings Overall:');
  allRelationships.forEach((rel, idx) => {
    console.log(`   ${idx + 1}. ${rel.primaryCropId.name_en} + ${rel.companionCropId.name_en}: ${rel.compatibilityScore}/100`);
  });
}

async function testLocation() {
  console.log('\n\n📍 Testing Location Model...');
  console.log('─'.repeat(60));
  
  // Create a test location
  console.log('Creating test location (Alishan: 23.5°N, 120.8°E, 1500m)...');
  
  const testLocation = new Location({
    latitude: 23.5,
    longitude: 120.8,
    elevation: 1500,
    locationName: 'Alishan Coffee Region',
    climateData: {
      annualTemp: 18,
      monthlyTemps: [14, 15, 16, 18, 20, 22, 23, 23, 21, 19, 17, 15],
      annualRainfall: 2500,
      monthlyRainfall: [100, 120, 180, 250, 300, 350, 400, 380, 320, 200, 150, 120],
      avgHumidity: 75,
      growingSeason: 300
    }
  });
  
  await testLocation.save();
  console.log('✅ Test location created successfully!');
  console.log(`   Coordinates: ${testLocation.coordinateString}`);
  console.log(`   Cache valid until: ${testLocation.cacheExpiry.toLocaleString()}`);
  console.log(`   Is cache valid: ${testLocation.isCacheValid}`);
  
  // Test finding location by coordinates
  const foundLocation = await Location.findByCoordinates(23.5, 120.8);
  if (foundLocation) {
    console.log('\n🔍 Successfully retrieved location by coordinates');
    console.log(`   Found: ${foundLocation.locationName} at ${foundLocation.elevation}m`);
  }
  
  // Clean up test location
  await Location.deleteOne({ _id: testLocation._id });
  console.log('\n🗑️  Test location cleaned up');
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║           🧪 Testing AgriOptimizer Models 🧪              ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    // Connect to database
    console.log('\n🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Connected successfully!\n');
    
    // Run all tests
    await testCrops();
    await testCoffeeVarieties();
    await testCompanionCrops();
    await testLocation();
    
    // Success summary
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║              ✅ ALL TESTS PASSED! ✅                       ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🎉 Your models and data are working perfectly!');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Create API routes for data retrieval');
    console.log('   2. Build the recommendation engine');
    console.log('   3. Start the development server: npm run dev');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERROR: Tests failed!\n');
    console.error('Error details:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    // Close connection
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
}

// ============================================================
// RUN TESTS
// ============================================================

if (require.main === module) {
  runAllTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runAllTests };