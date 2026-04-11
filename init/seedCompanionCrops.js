/**
 * Seed Companion Crops Data
 * Populates database with companion planting relationships for Taiwan crops
 * Based on permaculture principles and Taiwan farming practices
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const Crop = require('../models/Crop');
const CompanionCrop = require('../models/CompanionCrop');

// ============================================================
// COMPANION CROP RELATIONSHIPS
// ============================================================

// Note: This data will be populated after crops are seeded
// We'll match crop names to get ObjectIds

const companionRelationships = [
  // Coffee Companions
  {
    primaryCrop: 'Coffee (Arabica)',
    companionCrop: 'Ginger',
    compatibilityScore: 88,
    spatialArrangement: 'understory',
    benefits_en: 'Ginger grows well in coffee shade, provides additional income, improves soil structure, and helps with weed suppression.',
    benefits_zh: '薑在咖啡樹蔭下生長良好，提供額外收入，改善土壤結構，並幫助抑制雜草。',
    plantingRatio: '1:2 (1 coffee tree to 2 ginger plants)',
    spacingRecommendation: 'Plant ginger 50-80cm from coffee trunk',
    pestControl: true,
    nitrogenFixation: false,
    soilImprovement: true,
    pollination: false,
    shadeProvision: false,
    weedSuppression: true,
    plantingTimingNotes: 'Plant ginger in spring after coffee is established',
    managementTips_en: 'Ensure adequate moisture for ginger. Harvest ginger without disturbing coffee roots.',
    managementTips_zh: '確保薑有充足水分。收穫薑時避免破壞咖啡根系。',
    yieldImpact: 'positive',
    additionalIncome: true
  },
  {
    primaryCrop: 'Coffee (Arabica)',
    companionCrop: 'Turmeric',
    compatibilityScore: 85,
    spatialArrangement: 'understory',
    benefits_en: 'Similar to ginger - thrives in partial shade, provides additional revenue, natural pest deterrent properties.',
    benefits_zh: '與薑類似 - 在半陰環境中茂盛生長，提供額外收入，具有天然驅蟲特性。',
    plantingRatio: '1:2 (1 coffee tree to 2 turmeric plants)',
    spacingRecommendation: 'Plant turmeric 60-90cm from coffee trunk',
    pestControl: true,
    nitrogenFixation: false,
    soilImprovement: true,
    pollination: false,
    shadeProvision: false,
    weedSuppression: true,
    plantingTimingNotes: 'Plant in spring, harvest after 8-9 months',
    managementTips_en: 'Turmeric requires well-drained soil. Avoid overwatering which can cause root rot.',
    managementTips_zh: '薑黃需要排水良好的土壤。避免過度澆水導致根部腐爛。',
    yieldImpact: 'positive',
    additionalIncome: true
  },
  {
    primaryCrop: 'Coffee (Arabica)',
    companionCrop: 'Basil',
    compatibilityScore: 75,
    spatialArrangement: 'border',
    benefits_en: 'Repels pests like aphids and whiteflies. Attracts beneficial insects. Easy to harvest without disturbing coffee.',
    benefits_zh: '驅除蚜蟲和白粉蝨等害蟲。吸引有益昆蟲。易於採收且不影響咖啡。',
    plantingRatio: 'Border planting (every 1-2 meters)',
    spacingRecommendation: 'Plant along field borders, 30-40cm spacing',
    pestControl: true,
    nitrogenFixation: false,
    soilImprovement: false,
    pollination: true,
    shadeProvision: false,
    weedSuppression: false,
    plantingTimingNotes: 'Plant basil after last frost, replant every season',
    managementTips_en: 'Regular harvesting encourages bushier growth. Can be intercropped between coffee rows.',
    managementTips_zh: '定期採收促進更茂密的生長。可在咖啡行間間作。',
    yieldImpact: 'neutral',
    additionalIncome: true
  },

  // Vegetable Companions
  {
    primaryCrop: 'Tomato',
    companionCrop: 'Basil',
    compatibilityScore: 92,
    spatialArrangement: 'intercrop',
    benefits_en: 'Classic companion pair. Basil repels tomato hornworms, whiteflies, and aphids. Improves tomato flavor and growth.',
    benefits_zh: '經典的伴生植物組合。羅勒驅除番茄天蛾、白粉蝨和蚜蟲。改善番茄風味和生長。',
    plantingRatio: '1:1 (alternate plants)',
    spacingRecommendation: 'Plant basil 15-20cm from tomato base',
    pestControl: true,
    nitrogenFixation: false,
    soilImprovement: false,
    pollination: true,
    shadeProvision: false,
    weedSuppression: false,
    plantingTimingNotes: 'Plant basil 2 weeks after tomatoes',
    managementTips_en: 'Both need similar watering. Pinch basil flowers to maintain leaf production.',
    managementTips_zh: '兩者需要類似的澆水。摘除羅勒花朵以維持葉片生產。',
    yieldImpact: 'positive',
    additionalIncome: true
  },
  {
    primaryCrop: 'Cabbage',
    companionCrop: 'Mint',
    compatibilityScore: 78,
    spatialArrangement: 'border',
    benefits_en: 'Mint repels cabbage moths and flea beetles. Strong scent masks cabbage from pests.',
    benefits_zh: '薄荷驅除菜蛾和跳甲。強烈氣味掩蓋高麗菜免受害蟲侵襲。',
    plantingRatio: 'Border planting',
    spacingRecommendation: 'Plant mint in borders, contained to prevent spread',
    pestControl: true,
    nitrogenFixation: false,
    soilImprovement: false,
    pollination: true,
    shadeProvision: false,
    weedSuppression: false,
    plantingTimingNotes: 'Plant mint in containers or barriers (invasive)',
    managementTips_en: 'IMPORTANT: Keep mint contained as it spreads aggressively. Use pots or deep barriers.',
    managementTips_zh: '重要：薄荷會侵略性蔓延，需要容器或深層屏障來控制。',
    yieldImpact: 'neutral',
    additionalIncome: true
  },
  {
    primaryCrop: 'Cucumber',
    companionCrop: 'Radish',
    compatibilityScore: 80,
    spatialArrangement: 'intercrop',
    benefits_en: 'Radishes deter cucumber beetles. Fast-growing radish is harvested before cucumbers need full space.',
    benefits_zh: '蘿蔔驅除黃瓜甲蟲。快速生長的蘿蔔在黃瓜需要全部空間前收穫。',
    plantingRatio: 'Alternate rows',
    spacingRecommendation: 'Plant radish between cucumber hills',
    pestControl: true,
    nitrogenFixation: false,
    soilImprovement: true,
    pollination: false,
    shadeProvision: false,
    weedSuppression: true,
    plantingTimingNotes: 'Plant radish at same time as cucumber',
    managementTips_en: 'Harvest radish within 30 days before cucumber vines spread.',
    managementTips_zh: '在黃瓜藤蔓擴展前30天內收穫蘿蔔。',
    yieldImpact: 'neutral',
    additionalIncome: true
  },
  {
    primaryCrop: 'Bell Pepper',
    companionCrop: 'Basil',
    compatibilityScore: 85,
    spatialArrangement: 'intercrop',
    benefits_en: 'Basil repels aphids, spider mites, and thrips. May enhance pepper flavor and growth.',
    benefits_zh: '羅勒驅除蚜蟲、紅蜘蛛和薊馬。可能增強甜椒風味和生長。',
    plantingRatio: '1:1 or 2:1 (pepper:basil)',
    spacingRecommendation: 'Plant basil 20-30cm from pepper base',
    pestControl: true,
    nitrogenFixation: false,
    soilImprovement: false,
    pollination: true,
    shadeProvision: false,
    weedSuppression: false,
    plantingTimingNotes: 'Plant together in warm soil (20°C+)',
    managementTips_en: 'Both love heat and sun. Water consistently but avoid overhead watering.',
    managementTips_zh: '兩者都喜歡熱和陽光。持續澆水但避免頭頂澆水。',
    yieldImpact: 'positive',
    additionalIncome: true
  },

  // Fruit Tree Companions
  {
    primaryCrop: 'Passion Fruit',
    companionCrop: 'Green Onion',
    compatibilityScore: 72,
    spatialArrangement: 'understory',
    benefits_en: 'Green onions deter pests with strong scent. Shallow roots don\'t compete with passion fruit.',
    benefits_zh: '青蔥以強烈氣味驅趕害蟲。淺根不與百香果競爭。',
    plantingRatio: 'Multiple green onion plants per vine',
    spacingRecommendation: 'Plant in clusters 30-40cm from vine base',
    pestControl: true,
    nitrogenFixation: false,
    soilImprovement: false,
    pollination: false,
    shadeProvision: false,
    weedSuppression: true,
    plantingTimingNotes: 'Plant after passion fruit is established',
    managementTips_en: 'Green onions are perennial - harvest leaves, leave roots. Replant from divisions.',
    managementTips_zh: '青蔥是多年生植物 - 收穫葉片，保留根部。從分株重新種植。',
    yieldImpact: 'neutral',
    additionalIncome: true
  },
  {
    primaryCrop: 'Dragon Fruit',
    companionCrop: 'Basil',
    compatibilityScore: 68,
    spatialArrangement: 'border',
    benefits_en: 'Basil attracts pollinators crucial for dragon fruit. Repels some pests. Provides ground cover.',
    benefits_zh: '羅勒吸引對火龍果至關重要的授粉昆蟲。驅除某些害蟲。提供地面覆蓋。',
    plantingRatio: 'Border planting every 1-2 meters',
    spacingRecommendation: 'Plant along dragon fruit support posts',
    pestControl: true,
    nitrogenFixation: false,
    soilImprovement: false,
    pollination: true,
    shadeProvision: false,
    weedSuppression: true,
    plantingTimingNotes: 'Plant basil in warm season',
    managementTips_en: 'Keep basil away from direct base of dragon fruit (cactus needs dry conditions).',
    managementTips_zh: '保持羅勒遠離火龍果直接基部（仙人掌需要乾燥條件）。',
    yieldImpact: 'neutral',
    additionalIncome: true
  },

  // High Mountain Vegetables
  {
    primaryCrop: 'Cabbage',
    companionCrop: 'Lettuce',
    compatibilityScore: 75,
    spatialArrangement: 'intercrop',
    benefits_en: 'Both cool-season crops with similar needs. Lettuce harvested early provides space for cabbage expansion.',
    benefits_zh: '都是冷季作物，需求相似。萵苣早期收穫為高麗菜擴展提供空間。',
    plantingRatio: 'Alternate rows or stagger planting',
    spacingRecommendation: 'Plant lettuce 15-20cm from cabbage',
    pestControl: false,
    nitrogenFixation: false,
    soilImprovement: false,
    pollination: false,
    shadeProvision: false,
    weedSuppression: true,
    plantingTimingNotes: 'Plant lettuce 2 weeks before cabbage',
    managementTips_en: 'Harvest lettuce before cabbage heads form. Both need consistent moisture.',
    managementTips_zh: '在高麗菜結球前收穫萵苣。兩者都需要持續水分。',
    yieldImpact: 'neutral',
    additionalIncome: true
  },
  {
    primaryCrop: 'Tomato',
    companionCrop: 'Coriander',
    compatibilityScore: 70,
    spatialArrangement: 'intercrop',
    benefits_en: 'Coriander attracts beneficial insects and pollinators. Can help with aphid control.',
    benefits_zh: '香菜吸引有益昆蟲和授粉者。可幫助控制蚜蟲。',
    plantingRatio: '2:1 (tomato:coriander)',
    spacingRecommendation: 'Plant coriander 20-30cm from tomatoes',
    pestControl: true,
    nitrogenFixation: false,
    soilImprovement: false,
    pollination: true,
    shadeProvision: false,
    weedSuppression: false,
    plantingTimingNotes: 'Plant coriander in cooler months (bolts in heat)',
    managementTips_en: 'Succession plant coriander every 2-3 weeks. Let some plants bolt to attract beneficial insects.',
    managementTips_zh: '每2-3週連續種植香菜。讓一些植物開花以吸引有益昆蟲。',
    yieldImpact: 'neutral',
    additionalIncome: true
  },

  // Specialty Crop Combinations
  {
    primaryCrop: 'Tea (High Mountain Oolong)',
    companionCrop: 'Lemongrass',
    compatibilityScore: 78,
    spatialArrangement: 'border',
    benefits_en: 'Lemongrass repels mosquitoes and some pests. Citral content may deter certain tea pests. Provides windbreak.',
    benefits_zh: '檸檬香茅驅趕蚊子和某些害蟲。檸檬醛含量可能驅除某些茶樹害蟲。提供防風林。',
    plantingRatio: 'Border planting every 2-3 meters',
    spacingRecommendation: 'Plant as border, 50cm from tea bushes',
    pestControl: true,
    nitrogenFixation: false,
    soilImprovement: false,
    pollination: false,
    shadeProvision: false,
    weedSuppression: true,
    plantingTimingNotes: 'Plant lemongrass in spring',
    managementTips_en: 'Harvest lemongrass regularly. Don\'t let it overshadow young tea plants.',
    managementTips_zh: '定期收穫檸檬香茅。不要讓它遮擋年輕茶樹。',
    yieldImpact: 'neutral',
    additionalIncome: true
  },
  {
    primaryCrop: 'Ginger',
    companionCrop: 'Turmeric',
    compatibilityScore: 90,
    spatialArrangement: 'mixed',
    benefits_en: 'Both are rhizome crops with identical growing requirements. Can be planted together for crop diversity and market flexibility.',
    benefits_zh: '都是根莖作物，生長需求相同。可以一起種植以實現作物多樣性和市場靈活性。',
    plantingRatio: '1:1 or based on market demand',
    spacingRecommendation: 'Alternate rows or mixed planting',
    pestControl: false,
    nitrogenFixation: false,
    soilImprovement: true,
    pollination: false,
    shadeProvision: false,
    weedSuppression: true,
    plantingTimingNotes: 'Plant together in spring',
    managementTips_en: 'Same cultural practices for both. Harvest together or stagger for labor management.',
    managementTips_zh: '兩者栽培方法相同。可一起收穫或錯開收穫以管理勞動力。',
    yieldImpact: 'neutral',
    additionalIncome: true
  }
];

// ============================================================
// SEED FUNCTION
// ============================================================

async function seedCompanionCrops() {
  try {
    console.log('🌿 Starting companion crops seeding process...\n');
    
    // Connect to database
    await connectDB();
    
    // Clear existing companion crops
    console.log('🗑️  Clearing existing companion crop relationships...');
    const deleteResult = await CompanionCrop.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} existing relationships\n`);
    
    // Get all crops to match names to ObjectIds
    console.log('📋 Fetching crops from database...');
    const allCrops = await Crop.find({});
    console.log(`   Found ${allCrops.length} crops in database\n`);
    
    // Create a map of crop names to ObjectIds
    const cropMap = {};
    allCrops.forEach(crop => {
      cropMap[crop.name_en] = crop._id;
    });
    
    // Convert relationships to use ObjectIds
    console.log('🔗 Creating companion crop relationships...');
    const companionDocs = [];
    let skipped = 0;
    
    for (const relationship of companionRelationships) {
      const primaryId = cropMap[relationship.primaryCrop];
      const companionId = cropMap[relationship.companionCrop];
      
      if (primaryId && companionId) {
        companionDocs.push({
          primaryCropId: primaryId,
          companionCropId: companionId,
          compatibilityScore: relationship.compatibilityScore,
          spatialArrangement: relationship.spatialArrangement,
          benefits_en: relationship.benefits_en,
          benefits_zh: relationship.benefits_zh,
          plantingRatio: relationship.plantingRatio,
          spacingRecommendation: relationship.spacingRecommendation,
          pestControl: relationship.pestControl,
          nitrogenFixation: relationship.nitrogenFixation,
          soilImprovement: relationship.soilImprovement,
          pollination: relationship.pollination,
          shadeProvision: relationship.shadeProvision,
          weedSuppression: relationship.weedSuppression,
          plantingTimingNotes: relationship.plantingTimingNotes,
          managementTips_en: relationship.managementTips_en,
          managementTips_zh: relationship.managementTips_zh,
          yieldImpact: relationship.yieldImpact,
          additionalIncome: relationship.additionalIncome
        });
      } else {
        console.log(`   ⚠️  Skipped: ${relationship.primaryCrop} + ${relationship.companionCrop} (crop not found)`);
        skipped++;
      }
    }
    
    // Insert companion crop relationships
    if (companionDocs.length > 0) {
      console.log(`📥 Inserting ${companionDocs.length} companion relationships...`);
      const inserted = await CompanionCrop.insertMany(companionDocs);
      console.log(`   ✅ Inserted ${inserted.length} relationships successfully!\n`);
    } else {
      console.log('   ❌ No valid relationships to insert\n');
    }
    
    if (skipped > 0) {
      console.log(`   ⚠️  Skipped ${skipped} relationships due to missing crops\n`);
    }
    
    // Display summary
    console.log('📊 Companion Crop Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Get populated relationships for display
    const relationships = await CompanionCrop.find({})
      .populate('primaryCropId companionCropId')
      .sort({ compatibilityScore: -1 });
    
    console.log('🏆 Top 5 Companion Pairings (by compatibility):');
    relationships.slice(0, 5).forEach((rel, idx) => {
      console.log(`   ${idx + 1}. ${rel.primaryCropId.name_en} + ${rel.companionCropId.name_en}`);
      console.log(`      Score: ${rel.compatibilityScore}/100 | Arrangement: ${rel.spatialArrangement}`);
    });
    
    console.log('\n📈 Agronomic Benefits Summary:');
    const totalRels = relationships.length;
    const pestControl = relationships.filter(r => r.pestControl).length;
    const soilImprovement = relationships.filter(r => r.soilImprovement).length;
    const pollination = relationships.filter(r => r.pollination).length;
    const weedSuppression = relationships.filter(r => r.weedSuppression).length;
    
    console.log(`   Pest Control: ${pestControl}/${totalRels} (${Math.round(pestControl/totalRels*100)}%)`);
    console.log(`   Soil Improvement: ${soilImprovement}/${totalRels} (${Math.round(soilImprovement/totalRels*100)}%)`);
    console.log(`   Pollination: ${pollination}/${totalRels} (${Math.round(pollination/totalRels*100)}%)`);
    console.log(`   Weed Suppression: ${weedSuppression}/${totalRels} (${Math.round(weedSuppression/totalRels*100)}%)`);
    
    console.log('\n📐 Spatial Arrangement Distribution:');
    const arrangements = await CompanionCrop.aggregate([
      {
        $group: {
          _id: '$spatialArrangement',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    arrangements.forEach(arr => {
      console.log(`   ${arr._id}: ${arr.count} relationships`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Companion crops seeding completed successfully!');
    console.log(`📦 Total relationships in database: ${companionDocs.length}\n`);
    console.log('🎉 Done! Companion crop data ready for intercropping recommendations.\n');
    
  } catch (error) {
    console.error('❌ Error seeding companion crops:', error);
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
  seedCompanionCrops()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedCompanionCrops, companionRelationships };