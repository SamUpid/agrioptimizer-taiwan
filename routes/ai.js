const express = require('express');
const router = express.Router();
const { getCropPreview } = require('../utils/aiAdvisor');

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

module.exports = router;
