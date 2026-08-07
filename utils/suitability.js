/**
 * Crop Suitability Algorithm
 * Calculates how well a crop matches the farm's climate conditions
 */

/**
 * Calculate temperature suitability (0-100)
 * @param {Number} avgTemp - Average annual temperature
 * @param {Number} minTemp - Minimum monthly temperature
 * @param {Number} maxTemp - Maximum monthly temperature
 * @param {Object} crop - Crop object with tempMin/tempMax/tempOptimal
 * @returns {Number} Score 0-100
 */
function calculateTemperatureMatch(avgTemp, minTemp, maxTemp, crop) {
    if (!crop.optimalTempMin || !crop.optimalTempMax) return 0;
  // Check if temperatures are within crop's absolute range
  if (minTemp < crop.optimalTempMin || maxTemp > crop.optimalTempMax) {
    // Partial penalty if slightly outside range
    const belowMin = Math.max(0, crop.optimalTempMin - minTemp);
    const aboveMax = Math.max(0, maxTemp - crop.optimalTempMax);
    const penalty = (belowMin + aboveMax) * 5; // 5 points per degree outside
    return Math.max(0, 100 - penalty);
  }

  // Calculate how close to optimal temperature
  const optimalTemp = crop.tempOptimal || (crop.optimalTempMin + crop.optimalTempMax) / 2;
  const deviation = Math.abs(avgTemp - optimalTemp);
  
  // Perfect score if within 2°C of optimal, declining after
  if (deviation <= 2) return 100;
  if (deviation <= 5) return 90;
  if (deviation <= 8) return 75;
  return Math.max(50, 100 - deviation * 5);
}

/**
 * Calculate rainfall suitability (0-100)
 * @param {Number} annualRainfall - Annual rainfall in mm
 * @param {Object} crop - Crop object with rainfallMin/rainfallMax
 * @returns {Number} Score 0-100
 */
function calculateRainfallMatch(annualRainfall, crop) {
    if (!crop.minRainfall || !crop.maxRainfall) return 0;
  const min = crop.minRainfall;
  const max = crop.maxRainfall;
  const optimal = (min + max) / 2;

  // Outside range penalty
  if (annualRainfall < min) {
    const deficit = min - annualRainfall;
    return Math.max(0, 100 - deficit / 10); // -10 points per 100mm deficit
  }
  
  if (annualRainfall > max) {
    const excess = annualRainfall - max;
    return Math.max(0, 100 - excess / 15); // -6.7 points per 100mm excess (less harsh)
  }

  // Within range - score based on distance from optimal
  const deviation = Math.abs(annualRainfall - optimal);
  if (deviation <= 100) return 100;
  if (deviation <= 300) return 90;
  if (deviation <= 500) return 80;
  return 70;
}

/**
 * Calculate elevation suitability (0-100)
 * @param {Number} elevation - Farm elevation in meters
 * @param {Object} crop - Crop object with elevationMin/elevationMax
 * @returns {Number} Score 0-100
 */
function calculateElevationMatch(elevation, crop) {
  const min = crop.minElevation || 0;
  const max = crop.maxElevation || 3000;

  // Outside range penalty
  if (elevation < min) {
    const below = min - elevation;
    return Math.max(0, 100 - below / 5); // -20 points per 100m below
  }
  
  if (elevation > max) {
    const above = elevation - max;
    return Math.max(0, 100 - above / 5); // -20 points per 100m above
  }

  // Within range - bonus for being in sweet spot
  const optimal = (min + max) / 2;
  const deviation = Math.abs(elevation - optimal);
  const range = max - min;
  
  if (deviation <= range * 0.2) return 100; // Within 20% of center
  if (deviation <= range * 0.4) return 90;  // Within 40% of center
  return 80; // Anywhere else in range
}

/**
 * Calculate overall crop suitability score
 * @param {Object} climate - Climate data (avgTemp, minTemp, maxTemp, annualRainfall)
 * @param {Number} elevation - Farm elevation
 * @param {Object} crop - Crop object
 * @returns {Object} { score, breakdown, recommendation }
 */
function calculateSuitability(climate, elevation, crop) {
  // Individual scores
  const tempScore = calculateTemperatureMatch(
    climate.avgTemp,
    climate.minTemp,
    climate.maxTemp,
    crop
  );
  
  const rainfallScore = calculateRainfallMatch(climate.annualRainfall, crop);
  const elevationScore = calculateElevationMatch(elevation, crop);
  
  // Market factor (based on price stability and demand)
  const avgPrice = (crop.marketPriceMin + crop.marketPriceMax) / 2;
  const marketScore = Math.min(100, (avgPrice / 50) * 100);
  
  // Weighted average
  const weights = {
    temperature: 0.40,  // 40% - most critical
    rainfall: 0.30,     // 30% - very important
    elevation: 0.20,    // 20% - important for some crops
    market: 0.10        // 10% - economic factor
  };
  
  const totalScore = Math.round(
    tempScore * weights.temperature +
    rainfallScore * weights.rainfall +
    elevationScore * weights.elevation +
    marketScore * weights.market
  );

  // Recommendation category
  let recommendation = 'Not Recommended';
  let color = 'danger';
  if (totalScore >= 85) { recommendation = 'Highly Suitable'; color = 'success'; }
  else if (totalScore >= 70) { recommendation = 'Suitable'; color = 'success'; }
  else if (totalScore >= 55) { recommendation = 'Moderately Suitable'; color = 'warning'; }
  else if (totalScore >= 40) { recommendation = 'Challenging'; color = 'warning'; }

  return {
    score: totalScore,
    recommendation,
    color,
    breakdown: {
      temperature: Math.round(tempScore),
      rainfall: Math.round(rainfallScore),
      elevation: Math.round(elevationScore),
      market: Math.round(marketScore)
    },
    weights
  };
}

/**
 * Get top N suitable crops for given conditions
 * @param {Array} crops - Array of crop objects
 * @param {Object} climate - Climate data
 * @param {Number} elevation - Elevation
 * @param {Number} limit - Number of results (default 10)
 * @returns {Array} Sorted array of crops with suitability scores
 */
function getTopSuitableCrops(crops, climate, elevation, limit = 10) {
  const cropsWithScores = crops.map(crop => {
    const suitability = calculateSuitability(climate, elevation, crop);
    return {
      ...crop.toObject(),
      suitability
    };
  });

  // Sort by score descending
  cropsWithScores.sort((a, b) => b.suitability.score - a.suitability.score);

  return cropsWithScores.slice(0, limit);
}

/**
 * Calculate elevation suitability for coffee varieties (0-100)
 * Same shape as calculateElevationMatch but for CoffeeVariety's field names
 * @param {Number} elevation - Farm elevation in meters
 * @param {Object} coffee - CoffeeVariety object with optimalElevationMin/Max
 * @returns {Number} Score 0-100
 */
function calculateCoffeeElevationMatch(elevation, coffee) {
  const min = coffee.optimalElevationMin ?? 0;
  const max = coffee.optimalElevationMax ?? 3000;

  if (elevation < min) {
    const below = min - elevation;
    return Math.max(0, 100 - below / 5);
  }
  if (elevation > max) {
    const above = elevation - max;
    return Math.max(0, 100 - above / 5);
  }

  const optimal = (min + max) / 2;
  const deviation = Math.abs(elevation - optimal);
  const range = max - min || 1;

  if (deviation <= range * 0.2) return 100;
  if (deviation <= range * 0.4) return 90;
  return 80;
}

/**
 * Calculate overall coffee suitability score for a given elevation
 * Weighted: elevation match (75%) + cup quality potential (25%)
 * @param {Number} elevation - Farm elevation
 * @param {Object} coffee - CoffeeVariety object
 * @returns {Object} { score, elevationScore, qualityScore }
 */
function calculateCoffeeSuitability(elevation, coffee) {
  const elevationScore = calculateCoffeeElevationMatch(elevation, coffee);
  // Scale cupQualityMax (typically 78-96 SCAA) onto a 0-100 band
  const cupMax = coffee.cupQualityMax || 80;
  const qualityScore = Math.max(0, Math.min(100, (cupMax - 60) * (100 / 40)));

  const score = Math.round(elevationScore * 0.75 + qualityScore * 0.25);

  return {
    score,
    elevationScore: Math.round(elevationScore),
    qualityScore: Math.round(qualityScore)
  };
}

module.exports = {
  calculateTemperatureMatch,
  calculateRainfallMatch,
  calculateElevationMatch,
  calculateSuitability,
  getTopSuitableCrops,
  calculateCoffeeElevationMatch,
  calculateCoffeeSuitability
};