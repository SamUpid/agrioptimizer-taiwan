const express = require('express');
const router = express.Router();
const { getCropPreview, explainEconomicsFit, chatWithAdvisor } = require('../utils/aiAdvisor');
const FarmProfile = require('../models/FarmProfile');

/**
 * POST /api/ai/crop-preview
 * Body: { elevation, lat, lng, locationName }
 * Returns: { success, recommendations: [...], generalAdvice, generalAdviceZh }
 */
router.post('/crop-preview', async (req, res) => {
  try {
    const { elevation, lat, lng, locationName } = req.body;

    if (elevation === undefined || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields: elevation, lat, lng' });
    }

    const preview = await getCropPreview(Number(elevation), Number(lat), Number(lng), locationName || 'Taiwan Mountain Farm');
    
    // Return the recommendations array and general advice
    return res.json({ 
      success: true,
      recommendations: preview.recommendations || [],
      generalAdvice: preview.generalAdvice || '',
      generalAdviceZh: preview.generalAdviceZh || ''
    });
  } catch (error) {
    console.error('AI crop-preview error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch crop recommendations' });
  }
});

/**
 * POST /api/ai/economics-explain
 * Body: { name, category, priceRange, difficulty, marketDemandIndex, elevation }
 * Returns: { success, explanation, explanationZh }
 */
router.post('/economics-explain', async (req, res) => {
  try {
    const { name, category, priceRange, difficulty, marketDemandIndex, elevation } = req.body;

    if (!name || elevation === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields: name, elevation' });
    }

    const result = await explainEconomicsFit(
      { name, category, priceRange, difficulty, marketDemandIndex },
      Number(elevation)
    );

    return res.json({ success: true, explanation: result.explanation, explanationZh: result.explanationZh });
  } catch (error) {
    console.error('AI economics-explain error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate explanation' });
  }
});

/**
 * POST /api/ai/chat
 * Body: { message, history: [{ role: 'user'|'model', text }] }
 * Requires login — injects the farmer's own profile (elevation, zone, saved crops) as context.
 * Returns: { success, reply }
 */
router.post('/chat', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ success: false, error: 'Please sign in to use the advisor' });
    }

    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const farmProfile = await FarmProfile.findOne({ userId: req.session.user._id });

    const farmContext = {
      elevation: farmProfile?.location?.elevation ?? null,
      zone:      farmProfile?.location?.altitudeZone || null,
      crops:     (farmProfile?.crops   || []).map(c => c.cropName).filter(Boolean),
      coffees:   (farmProfile?.coffees || []).map(c => c.coffeeName).filter(Boolean)
    };

    // Cap history length sent back to the model to keep requests small
    const trimmedHistory = Array.isArray(history) ? history.slice(-20) : [];

    const reply = await chatWithAdvisor(message.trim(), trimmedHistory, farmContext);

    return res.json({ success: true, reply });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({ success: false, error: 'Failed to reach the advisor' });
  }
});

module.exports = router;