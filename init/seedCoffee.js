/**
 * Seed Coffee Varieties Data
 * Populates database with coffee varieties suitable for Taiwan (800-1500m elevation)
 * Data based on Taiwan coffee research and specialty coffee standards
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const CoffeeVariety = require('../models/CoffeeVariety');

// ============================================================
// COFFEE VARIETY DATA (7 Varieties)
// ============================================================

const coffeeVarieties = [
  {
    varietyName: 'Typica',
    imageUrl: "https://images.unsplash.com/photo-1586095516671-d085ff58cdd4?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    varietyName_zh: '鐵比卡',
    optimalElevationMin: 800,
    optimalElevationMax: 1500,
    tempDifferentialMin: 8,
    diseaseResistance: 'low',
    cupQualityMin: 82,
    cupQualityMax: 90,
    harvestMonths: 'November to February',
    processingMethods: ['washed', 'natural', 'honey'],
    flavorNotes_en: 'Clean, sweet, balanced with notes of chocolate and nuts',
    flavorNotes_zh: '乾淨、甜美、平衡，帶有巧克力和堅果香氣',
    qualityTips_en: 'Requires careful pest management due to low disease resistance. Best grown at 1000-1400m for optimal cup quality. Needs consistent shade and good drainage.',
    qualityTips_zh: '由於抗病性低，需要仔細的病蟲害管理。最佳種植海拔為1000-1400公尺以獲得最佳杯測品質。需要持續遮蔭和良好的排水。',
    yieldPerTree: 1.5,
    treesPerHectare: 1200,
    yearsToFirstHarvest: 3,
    productiveYears: 25
  },
  {
    varietyName: 'Bourbon',
    imageUrl: "https://images.unsplash.com/photo-1694558334826-a371e09fae1d?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    varietyName_zh: '波旁',
    optimalElevationMin: 900,
    optimalElevationMax: 1600,
    tempDifferentialMin: 8,
    diseaseResistance: 'low',
    cupQualityMin: 83,
    cupQualityMax: 91,
    harvestMonths: 'November to February',
    processingMethods: ['washed', 'natural', 'honey'],
    flavorNotes_en: 'Sweet, fruity, complex with caramel and berry notes',
    flavorNotes_zh: '甜美、果香豐富、複雜，帶有焦糖和漿果香氣',
    qualityTips_en: 'Higher yield than Typica but equally susceptible to diseases. Produces excellent quality at high elevations. Requires regular pruning and nutrient management.',
    qualityTips_zh: '產量高於鐵比卡但同樣易受病害影響。在高海拔地區生產優質咖啡。需要定期修剪和營養管理。',
    yieldPerTree: 2.0,
    treesPerHectare: 1200,
    yearsToFirstHarvest: 3,
    productiveYears: 25
  },
  {
    varietyName: 'Caturra',
    imageUrl: "https://images.unsplash.com/photo-1550955731-5a4cfd898f64?q=80&w=1365&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    varietyName_zh: '卡杜拉',
    optimalElevationMin: 800,
    optimalElevationMax: 1400,
    tempDifferentialMin: 7,
    diseaseResistance: 'medium',
    cupQualityMin: 80,
    cupQualityMax: 87,
    harvestMonths: 'November to March',
    processingMethods: ['washed', 'honey', 'natural'],
    flavorNotes_en: 'Bright acidity, citrus notes, light body',
    flavorNotes_zh: '明亮酸度、柑橘香氣、清淡口感',
    qualityTips_en: 'Compact variety suitable for higher density planting. Good for Taiwan\'s smaller farms. Requires consistent fertilization due to higher yield.',
    qualityTips_zh: '緊湊型品種適合高密度種植。適合台灣較小的農場。由於產量較高，需要持續施肥。',
    yieldPerTree: 2.5,
    treesPerHectare: 1500,
    yearsToFirstHarvest: 3,
    productiveYears: 20
  },
  {
    varietyName: 'Catuai',
    imageUrl: "https://images.unsplash.com/photo-1662559102063-a665b04771fd?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    varietyName_zh: '卡杜艾',
    optimalElevationMin: 800,
    optimalElevationMax: 1500,
    tempDifferentialMin: 7,
    diseaseResistance: 'medium',
    cupQualityMin: 81,
    cupQualityMax: 88,
    harvestMonths: 'November to March',
    processingMethods: ['washed', 'honey', 'natural'],
    flavorNotes_en: 'Well-balanced, sweet, nutty with mild fruit notes',
    flavorNotes_zh: '平衡良好、甜美、堅果味帶有溫和果香',
    qualityTips_en: 'Excellent for Taiwan conditions - wind resistant and high yielding. Good choice for beginners. Responds well to organic farming practices.',
    qualityTips_zh: '非常適合台灣條件 - 抗風且高產。適合初學者。對有機農業實踐反應良好。',
    yieldPerTree: 2.8,
    treesPerHectare: 1400,
    yearsToFirstHarvest: 3,
    productiveYears: 22
  },
  {
    varietyName: 'SL28',
    imageUrl: "https://images.unsplash.com/photo-1500912708295-4cf8b060f381?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    varietyName_zh: 'SL28',
    optimalElevationMin: 1000,
    optimalElevationMax: 1600,
    tempDifferentialMin: 9,
    diseaseResistance: 'medium',
    cupQualityMin: 85,
    cupQualityMax: 93,
    harvestMonths: 'December to February',
    processingMethods: ['washed', 'natural'],
    flavorNotes_en: 'Complex, wine-like acidity, black currant, floral',
    flavorNotes_zh: '複雜、類似葡萄酒的酸度、黑醋栗、花香',
    qualityTips_en: 'Premium variety with exceptional cup quality. Best for high-altitude Taiwan regions. Requires experienced management but commands premium prices.',
    qualityTips_zh: '優質品種，具有卓越的杯測品質。最適合台灣高海拔地區。需要有經驗的管理，但可獲得高價。',
    yieldPerTree: 1.8,
    treesPerHectare: 1100,
    yearsToFirstHarvest: 3,
    productiveYears: 28
  },
  {
    varietyName: 'SL34',
    imageUrl: "https://plus.unsplash.com/premium_photo-1670758291967-25ed2e90f21e?q=80&w=3687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    varietyName_zh: 'SL34',
    optimalElevationMin: 1000,
    optimalElevationMax: 1600,
    tempDifferentialMin: 9,
    diseaseResistance: 'medium',
    cupQualityMin: 84,
    cupQualityMax: 92,
    harvestMonths: 'December to February',
    processingMethods: ['washed', 'natural'],
    flavorNotes_en: 'Intense fruit flavors, wine-like, complex sweetness',
    flavorNotes_zh: '濃郁果味、類似葡萄酒、複雜甜味',
    qualityTips_en: 'Similar to SL28 but with better disease resistance. Excellent for specialty coffee market. Requires full sun exposure and good soil preparation.',
    qualityTips_zh: '與SL28相似但抗病性更好。非常適合精品咖啡市場。需要充足日照和良好的土壤準備。',
    yieldPerTree: 2.0,
    treesPerHectare: 1100,
    yearsToFirstHarvest: 3,
    productiveYears: 28
  },
  {
    varietyName: 'Geisha (Gesha)',
    imageUrl: "https://images.unsplash.com/photo-1755601920093-5749b15ce893?q=80&w=2274&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    varietyName_zh: '藝伎',
    optimalElevationMin: 1200,
    optimalElevationMax: 1800,
    tempDifferentialMin: 10,
    diseaseResistance: 'high',
    cupQualityMin: 88,
    cupQualityMax: 96,
    harvestMonths: 'December to February',
    processingMethods: ['washed', 'natural', 'honey', 'anaerobic'],
    flavorNotes_en: 'Jasmine, bergamot, tropical fruit, tea-like',
    flavorNotes_zh: '茉莉花、佛手柑、熱帶水果、茶般香氣',
    qualityTips_en: 'World-renowned premium variety. Best at highest Taiwan elevations (1400m+). Commands exceptional prices but requires expert processing. Lower yield offset by premium pricing.',
    qualityTips_zh: '世界知名的頂級品種。在台灣最高海拔（1400公尺以上）表現最佳。價格極高但需要專業加工。較低產量可由高價彌補。',
    yieldPerTree: 1.2,
    treesPerHectare: 1000,
    yearsToFirstHarvest: 4,
    productiveYears: 30
  },
  {
    varietyName: 'Pacamara',
    varietyName_zh: '帕卡馬拉',
    imageUrl: 'https://images.unsplash.com/photo-1586095516671-d085ff58cdd4?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    optimalElevationMin: 1200,
    optimalElevationMax: 1800,
    tempDifferentialMin: 9,
    diseaseResistance: 'medium',
    cupQualityMin: 84,
    cupQualityMax: 92,
    harvestMonths: 'December to February',
    processingMethods: ['washed', 'natural', 'honey'],
    flavorNotes_en: 'Large beans, complex fruit, floral with wine-like acidity',
    flavorNotes_zh: '大粒豆，複雜果香，花香帶葡萄酒般酸度',
    qualityTips_en: 'Large-bean hybrid of Pacas and Maragogipe. Thrives at 1200–1800m in Taiwan. Requires careful processing due to large bean size. Commands premium specialty prices.',
    qualityTips_zh: '帕卡斯和馬拉戈日佩的大粒混種。在台灣1200–1800公尺茁壯。大豆粒需要仔細處理。可獲得精品咖啡高價。',
    yieldPerTree: 1.6,
    treesPerHectare: 1000,
    yearsToFirstHarvest: 3,
    productiveYears: 25
  }
];

// ============================================================
// SEED FUNCTION
// ============================================================

async function seedCoffee() {
  try {
    console.log('☕ Starting coffee varieties seeding process...\n');
    
    // Connect to database
    await connectDB();
    
    // Clear existing coffee varieties
    console.log('🗑️  Clearing existing coffee varieties...');
    const deleteResult = await CoffeeVariety.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} existing varieties\n`);
    
    // Insert new coffee varieties
    console.log('📥 Inserting new coffee varieties...');
    const insertedVarieties = await CoffeeVariety.insertMany(coffeeVarieties);
    console.log(`   ✅ Inserted ${insertedVarieties.length} varieties successfully!\n`);
    
    // Display summary
    console.log('📊 Coffee Variety Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const variety of insertedVarieties) {
      console.log(`☕ ${variety.varietyName} (${variety.varietyName_zh})`);
      console.log(`   Elevation: ${variety.optimalElevationMin}-${variety.optimalElevationMax}m`);
      console.log(`   Cup Quality: ${variety.cupQualityMin}-${variety.cupQualityMax} SCAA`);
      console.log(`   Disease Resistance: ${variety.diseaseResistance}`);
      console.log(`   Yield: ${variety.yieldPerTree} kg/tree`);
      console.log('');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Quality ranking
    console.log('🏆 Quality Ranking (by max cup score):');
    const sortedByQuality = [...insertedVarieties].sort((a, b) => b.cupQualityMax - a.cupQualityMax);
    sortedByQuality.forEach((v, idx) => {
      console.log(`   ${idx + 1}. ${v.varietyName}: ${v.cupQualityMax} SCAA`);
    });
    
    console.log('\n💰 Yield Ranking (by kg/tree):');
    const sortedByYield = [...insertedVarieties].sort((a, b) => b.yieldPerTree - a.yieldPerTree);
    sortedByYield.forEach((v, idx) => {
      console.log(`   ${idx + 1}. ${v.varietyName}: ${v.yieldPerTree} kg/tree`);
    });
    
    console.log('\n🛡️  Disease Resistance Summary:');
    const resistanceGroups = await CoffeeVariety.aggregate([
      {
        $group: {
          _id: '$diseaseResistance',
          count: { $sum: 1 },
          varieties: { $push: '$varietyName' }
        }
      }
    ]);
    resistanceGroups.forEach(group => {
      console.log(`   ${group._id}: ${group.varieties.join(', ')}`);
    });
    
    console.log('\n✅ Coffee varieties seeding completed successfully!');
    console.log(`📦 Total varieties in database: ${insertedVarieties.length}\n`);
    console.log('🎉 Done! Coffee varieties are ready for Taiwan mountain regions (800-1500m).\n');
    
  } catch (error) {
    console.error('❌ Error seeding coffee varieties:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// ============================================================
// RUN SEEDER
// ============================================================

// Run if called directly
if (require.main === module) {
  seedCoffee()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedCoffee, coffeeVarieties };