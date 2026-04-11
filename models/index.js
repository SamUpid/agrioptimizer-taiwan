/**
 * Models Index
 * Central export point for all Mongoose models
 * Usage: const { Crop, Location, CoffeeVariety, CompanionCrop } = require('./models');
 */

const Location = require('./Location');
const Crop = require('./Crop');
const CoffeeVariety = require('./CoffeeVariety');
const CompanionCrop = require('./CompanionCrop');

module.exports = {
  Location,
  Crop,
  CoffeeVariety,
  CompanionCrop
};