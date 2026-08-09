// AI Advisor Utility - Google Gemini API Integration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// gemini-3-flash-preview is being used
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

const cache = new Map();

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Multi-turn variant: takes a full conversation history (array of
// { role: 'user' | 'model', text }) plus an optional system instruction.
async function callGeminiChat(history, systemInstruction) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const body = {
    contents: history.map(turn => ({
      role: turn.role,
      parts: [{ text: turn.text }]
    }))
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function getCropPreview(elevation, lat, lng, locationName) {
  const cacheKey = `${lat},${lng}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const prompt = `You are a Taiwan mountain farming expert. A farmer has a farm at:
- Elevation: ${elevation}m
- Coordinates: ${lat}, ${lng}
- Location: ${locationName}

Recommend the TOP 3 crops for this elevation. Keep each crop recommendation concise, with reasoning and risk in 2-3 short sentences only. Return ONLY valid JSON:
{
  "elevation": ${elevation},
  "location": "${locationName}",
  "recommendations": [
    {
      "crop": "Crop Name",
      "cropZh": "作物名稱",
      "suitability": 90,
      "reasoning": "English reasoning",
      "reasoningZh": "中文解釋",
      "risk": "English risk",
      "riskZh": "中文風險"
    }
  ],
  "generalAdvice": "English advice",
  "generalAdviceZh": "中文建議"
}`;

  try {
    console.log('🤖 Calling Gemini for crop preview at', elevation + 'm...');
    const responseText = await callGemini(prompt);
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json\n?/, '').replace(/```\n?$/, '');
    if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```\n?/, '').replace(/```\n?$/, '');
    const result = JSON.parse(cleaned);
    cache.set(cacheKey, result);
    setTimeout(() => cache.delete(cacheKey), 24 * 60 * 60 * 1000);
    return result;
  } catch (error) {
    console.error('❌ Gemini API error:', error.message);
    return {
      elevation, location: locationName,
      recommendations: [{
        crop: "High-Mountain Oolong Tea", cropZh: "高山烏龍茶", suitability: 85,
        reasoning: "Cool temperatures at this elevation produce premium tea.", reasoningZh: "此海拔的涼爽溫度可生產優質茶葉。",
        risk: "Frost risk in winter", riskZh: "冬季有霜凍風險"
      }],
      generalAdvice: "Your elevation suits high-value mountain crops.", generalAdviceZh: "您的海拔適合高價值山地作物。"
    };
  }
}

function buildFallbackBrief(farmProfile, weather) {
  const temp = weather.currentTemp !== undefined && weather.currentTemp !== null ? `${weather.currentTemp}°C` : 'stable temperature';
  const condition = weather.condition || 'calm weather';
  const rain = weather.forecast?.some(day => day.rain !== undefined && day.rain !== null && day.rain > 50);
  const adviceParts = [];

  if (/frost|freeze|cold|冷|霜/i.test(condition) || (weather.currentTemp !== undefined && weather.currentTemp !== null && weather.currentTemp <= 5)) {
    adviceParts.push('Keep plants covered against cold overnight.');
  } else if (rain) {
    adviceParts.push('Protect young seedlings from heavy showers.');
  } else if (weather.currentTemp !== undefined && weather.currentTemp !== null && weather.currentTemp >= 30) {
    adviceParts.push('Watch soil moisture carefully in the heat.');
  } else {
    adviceParts.push('Maintain regular watering and check crop health.');
  }

  const adviceZh = adviceParts[0]
    .replace('Keep plants covered against cold overnight.', '夜間請覆蓋植物以防寒冷。')
    .replace('Protect young seedlings from heavy showers.', '請保護幼苗，防止暴雨。')
    .replace('Watch soil moisture carefully in the heat.', '高溫時請注意土壤濕度。')
    .replace('Maintain regular watering and check crop health.', '請保持定期灌溉並檢查作物健康。');

  return `Today at your farm: ${temp} with ${condition}. ${adviceParts[0]}\n今日農場：${temp}，${condition}。${adviceZh}`;
}

function summarizeCropAdvice(crops) {
  if (!crops?.length) return '';

  const lines = crops.slice(0, 3).map(crop => {
    const name = crop.cropName || crop.cropNameZh || 'Crop 作物';
    if (crop.healthScore !== undefined && crop.healthScore !== null) {
      return `For ${name}, the current health score is ${crop.healthScore}/100.`;
    }
    return `For ${name}, monitor growth and adjust care as needed.`;
  });

  const zhLines = crops.slice(0, 3).map(crop => {
    const name = crop.cropNameZh || crop.cropName || '作物';
    if (crop.healthScore !== undefined && crop.healthScore !== null) {
      return `${name}目前健康分數為 ${crop.healthScore}/100。`;
    }
    return `${name}請持續觀察生長並調整管理。`;
  });

  return `${lines.join(' ')}\n${zhLines.join(' ')}`;
}

async function getDailyBrief(farmProfile, weather) {
  const farmName = farmProfile.farmName || 'Your farm';
  const location = farmProfile.location?.address || 'your farm location';
  const elevation = farmProfile.location?.elevation !== undefined && farmProfile.location?.elevation !== null ? `${farmProfile.location.elevation}m` : 'its elevation';
  const currentTemp = weather.currentTemp !== undefined && weather.currentTemp !== null ? `${weather.currentTemp}°C` : 'moderate temperature';
  const condition = weather.condition || 'stable weather';
  const crops = farmProfile.crops || [];

  const urgentAlerts = [];
  if (/frost|freeze|cold|霜|寒/i.test(condition) || (weather.currentTemp !== undefined && weather.currentTemp !== null && weather.currentTemp <= 5)) {
    urgentAlerts.push('frost risk');
  }
  if (weather.forecast?.some(day => day.rain !== undefined && day.rain !== null && day.rain >= 70)) {
    urgentAlerts.push('heavy rain');
  }
  if (weather.forecast?.some(day => day.harvestOptimal)) {
    urgentAlerts.push('optimal harvest window');
  }
  const alertSummary = urgentAlerts.length ? urgentAlerts.join(' and ') : 'no urgent alerts';

  const prompt = `You are a helpful Taiwan mountain farm advisor. Create a morning farm briefing in bilingual English and Traditional Chinese. Use 3-4 sentences in each language. Cover:
- Today's weather impact on the farm at ${location} (${elevation})
- Any urgent alerts like frost, heavy rain, or optimal harvest timing
- Brief advice for the crops listed

Farm profile:
- Name: ${farmName}
- Location: ${location}
- Elevation: ${elevation}
- Crops: ${crops.length ? crops.map(c => c.cropName || c.cropNameZh || 'Unknown').join(', ') : 'None'}

Weather:
- Current temperature: ${currentTemp}
- Condition: ${condition}
- Forecast summary: ${weather.forecast?.length ? weather.forecast.map((day, index) => `${index === 0 ? 'Today' : day.day}: ${day.temp ?? 'N/A'}°C${day.weatherEmoji ? ' ' + day.weatherEmoji : ''}`).join('; ') : 'No forecast available'}
- Urgent alerts: ${alertSummary}

Return a single bilingual summary with English first, then Traditional Chinese.`;

  try {
    const responseText = await callGemini(prompt);
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```(?:json)?\n?/, '').replace(/```\n?$/, '');
    return cleaned;
  } catch (error) {
    console.error('❌ Gemini daily brief error:', error.message);
    return buildFallbackBrief(farmProfile, weather);
  }
}

// ============================================================
// Economics page — plain-language explanation of crop/elevation fit
// ============================================================
async function explainEconomicsFit(cropInfo, elevation) {
  const prompt = `You are a Taiwan mountain farming advisor. In plain, friendly language (no jargon), explain in 2-3 short sentences why "${cropInfo.name}" is a good (or risky) economic choice for a farm at ${elevation}m elevation in Taiwan.

Crop info:
- Category: ${cropInfo.category}
- Price range: ${cropInfo.priceRange}
- Difficulty: ${cropInfo.difficulty}
${cropInfo.marketDemandIndex ? `- Market demand index: ${cropInfo.marketDemandIndex}/100` : ''}

Return ONLY valid JSON, no markdown:
{
  "explanation": "English explanation, 2-3 sentences",
  "explanationZh": "中文解釋，2-3句話"
}`;

  try {
    const responseText = await callGemini(prompt);
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```(?:json)?\n?/, '').replace(/```\n?$/, '');
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('❌ Gemini economics-explain error:', error.message);
    return {
      explanation: `${cropInfo.name} is commonly grown around ${elevation}m in Taiwan and fits a ${cropInfo.difficulty} difficulty, ${cropInfo.category} profile — check the projection above for the numbers.`,
      explanationZh: `${cropInfo.name}常見於台灣海拔${elevation}公尺左右種植，屬於${cropInfo.difficulty}難度的${cropInfo.category}作物，詳細數字請參考上方預測。`
    };
  }
}

// ============================================================
// Advisor chat — multi-turn conversation with farm context injected
// ============================================================
async function chatWithAdvisor(message, history, farmContext) {
  const cropList = farmContext.crops?.length
    ? farmContext.crops.join(', ')
    : 'none saved yet';
  const coffeeList = farmContext.coffees?.length
    ? farmContext.coffees.join(', ')
    : 'none saved yet';

  const systemInstruction = `You are a knowledgeable, friendly Taiwan mountain farming advisor helping a specific farmer. Always answer in both English and Traditional Chinese (English first, then 中文). Keep answers focused and practical — a few sentences unless the farmer clearly asks for depth.

This farmer's profile:
- Farm elevation: ${farmContext.elevation ?? 'unknown'}m
- Altitude zone: ${farmContext.zone || 'unknown'}
- Saved crops: ${cropList}
- Saved coffee varieties: ${coffeeList}

Use this context naturally when relevant (e.g. if they ask "what should I plant", prioritize their zone and existing crops). Don't repeat the whole profile back to them unless asked.`;

  const contents = [
    ...history.map(turn => ({ role: turn.role, text: turn.text })),
    { role: 'user', text: message }
  ];

  try {
    const reply = await callGeminiChat(contents, systemInstruction);
    return reply.trim();
  } catch (error) {
    console.error('❌ Gemini advisor chat error:', error.message);
    return "Sorry, I couldn't reach the AI advisor right now — please try again in a moment.\n抱歉，目前無法連接AI顧問，請稍後再試。";
  }
}

module.exports = { getCropPreview, getDailyBrief, explainEconomicsFit, chatWithAdvisor };