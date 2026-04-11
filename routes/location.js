/**
 * Location Routes
 * Frontend routes for location selection and management
 */

const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// ============================================================
// PAGE ROUTES
// ============================================================

/**
 * GET /location - Show location selection page
 */
router.get('/', locationController.showLocationPage);

// ============================================================
// API ROUTES (AJAX endpoints)
// ============================================================

/**
 * POST /location/geocode - Convert address to coordinates
 * Body: { address: "台北市" }
 * Returns: { lat, lng, address, elevation }
 */
router.post('/geocode', locationController.geocode);

/**
 * POST /location/reverse-geocode - Convert coordinates to address
 * Body: { lat: 25.0330, lng: 121.5654 }
 * Returns: { address }
 */
router.post('/reverse-geocode', locationController.reverseGeocodeCoords);

/**
 * POST /location/fetch-elevation - Get elevation for coordinates
 * Body: { lat: 25.0330, lng: 121.5654 }
 * Returns: { elevation }
 */
router.post('/fetch-elevation', locationController.fetchElevation);

/**
 * POST /location/save - Save location to session
 * Body: { lat, lng, address?, elevation? }
 * Returns: { success, data }
 */
router.post('/save', locationController.saveLocation);

/**
 * POST /location/fetch-climate - Get climate data (Day 4 feature)
 * Body: { lat, lng }
 * Returns: { climateData }
 */
router.post('/fetch-climate', locationController.fetchClimateData);

/**
 * POST /location/clear - Clear location from session
 * Returns: { success }
 */
router.post('/clear', locationController.clearLocation);

/**
 * GET /location/current - Get current location from session
 * Returns: { hasLocation, data }
 */
router.get('/current', locationController.getCurrentLocation);

module.exports = router;