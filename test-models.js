require('dotenv').config();
const { connectDB } = require('./config/database');
const { Crop, Location, CoffeeVariety, CompanionCrop } = require('./models');

async function testModels() {
  await connectDB();
  
  console.log('✅ Models loaded successfully:');
  console.log('- Crop:', Crop.modelName);
  console.log('- Location:', Location.modelName);
  console.log('- CoffeeVariety:', CoffeeVariety.modelName);
  console.log('- CompanionCrop:', CompanionCrop.modelName);
  
  process.exit(0);
}

testModels();