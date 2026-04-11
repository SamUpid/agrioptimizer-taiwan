/**
 * Master Seed Script
 * Runs all seed scripts in the correct order
 * Usage: npm run seed OR node init/seedAll.js
 */

require('dotenv').config();
const { seedCrops } = require('./seedCrops');
const { seedCoffee } = require('./seedCoffee');
const { seedCompanionCrops } = require('./seedCompanionCrops');

// ============================================================
// MASTER SEED FUNCTION
// ============================================================

async function seedAll() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║         🌱 AgriOptimizer Taiwan Database Seeder 🌱        ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📅 Started at:', new Date().toLocaleString());
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // ==================== STEP 1: Crops ====================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 1/3: Seeding Crops');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    await seedCrops();
    
    // ==================== STEP 2: Coffee Varieties ====================
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('STEP 2/3: Seeding Coffee Varieties');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    await seedCoffee();
    
    // ==================== STEP 3: Companion Crops ====================
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('STEP 3/3: Seeding Companion Crop Relationships');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    await seedCompanionCrops();
    
    // ==================== SUCCESS SUMMARY ====================
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║              ✅ ALL SEEDING COMPLETED! ✅                  ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 Seeding Summary:');
    console.log('   ✅ Crops: 30+ varieties');
    console.log('   ✅ Coffee Varieties: 7 varieties');
    console.log('   ✅ Companion Relationships: 15+ pairings');
    console.log('');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log('📅 Completed at:', new Date().toLocaleString());
    console.log('');
    console.log('🎉 Your database is now ready for use!');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Test data retrieval: node init/testModels.js');
    console.log('   2. Start the server: npm run dev');
    console.log('   3. Visit: http://localhost:3000');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERROR: Seeding process failed!\n');
    console.error('Error details:', error.message);
    console.error('\nStack trace:', error.stack);
    console.error('\nPlease check:');
    console.error('   1. MongoDB connection string in .env file');
    console.error('   2. MongoDB Atlas network access (IP whitelist)');
    console.error('   3. Database user permissions');
    console.error('');
    process.exit(1);
  }
}

// ============================================================
// RUN MASTER SEEDER
// ============================================================

// Run if called directly
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log('✅ Exiting with success status\n');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Exiting with error status\n');
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedAll };