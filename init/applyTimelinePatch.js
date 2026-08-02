/**
 * applies timeline to each crops - applyTimelinePatch.js
 * Usage: node init/applyTimelinePatch.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Crop = require('../models/Crop');

const timelineData = {
  'Coffee (Arabica)': {
    plantingSeasons: ['March-April', 'September-October'],
    daysToMaturity: 1095,
    harvestSeasons: ['November-February'],
    yieldPeriod: 'Perennial (20-30 years productive)',
    soilPH: { min: 5.5, max: 6.5 },
    bestPractices: [
      'Plant under shade trees to reduce heat stress',
      'Prune annually to maintain 2-3m height for easy harvesting',
      'Use organic mulch to retain moisture and suppress weeds'
    ],
    commonPests: [
      { name: 'Coffee Berry Borer', management: 'Use red-eyed fly traps; harvest promptly when ripe' },
      { name: 'Leaf Rust', management: 'Apply copper-based fungicide; improve air circulation by pruning' }
    ]
  },
  'Tea (High Mountain Oolong)': {
    plantingSeasons: ['February-March', 'September-October'],
    daysToMaturity: 730,
    harvestSeasons: ['April-May (Spring)', 'June-July (Summer)', 'October-November (Winter)'],
    yieldPeriod: 'Perennial (50+ years productive)',
    soilPH: { min: 4.5, max: 6.0 },
    bestPractices: [
      'Pick only the top 2-3 leaves and bud for premium quality',
      'Allow rest periods between harvests for quality recovery',
      'Morning harvest preferred when temperature is cool'
    ],
    commonPests: [
      { name: 'Tea Green Leafhopper', management: 'Reduces yield but creates natural bug-bitten oolong; monitor levels' },
      { name: 'Blister Blight', management: 'Improve drainage; apply copper fungicide in wet seasons' }
    ]
  },
  'Ginger': {
    plantingSeasons: ['March-April'],
    daysToMaturity: 240,
    harvestSeasons: ['October-December'],
    yieldPeriod: 'Annual',
    soilPH: { min: 5.5, max: 6.5 },
    bestPractices: [
      'Plant rhizomes in well-drained loamy soil rich in organic matter',
      'Mulch heavily to keep soil moist and suppress weeds',
      'Harvest when leaves start to yellow in autumn'
    ],
    commonPests: [
      { name: 'Rhizome Rot', management: 'Use well-drained soil; avoid overwatering; treat with fungicide' },
      { name: 'Shoot Borer', management: 'Remove infected shoots promptly; apply neem oil spray' }
    ]
  },
  'Turmeric': {
    plantingSeasons: ['March-May'],
    daysToMaturity: 270,
    harvestSeasons: ['November-January'],
    yieldPeriod: 'Annual',
    soilPH: { min: 5.5, max: 7.0 },
    bestPractices: [
      'Plant rhizomes 5-7cm deep in well-tilled soil',
      'Apply organic compost at planting and mid-season',
      'Harvest when foliage turns yellow and dries'
    ],
    commonPests: [
      { name: 'Rhizome Rot', management: 'Ensure good drainage; treat seed rhizomes with fungicide before planting' },
      { name: 'Leaf Spot', management: 'Apply mancozeb fungicide; remove infected leaves' }
    ]
  },
  'Passion Fruit': {
    plantingSeasons: ['March-April', 'September-October'],
    daysToMaturity: 180,
    harvestSeasons: ['Year-round with peaks in Summer and Winter'],
    yieldPeriod: 'Perennial (5-7 years productive)',
    soilPH: { min: 5.5, max: 7.0 },
    bestPractices: [
      'Provide strong trellis support — vines can grow 15m+',
      'Hand-pollinate flowers in early morning for better fruit set',
      'Prune after harvest to encourage new fruiting growth'
    ],
    commonPests: [
      { name: 'Woodiness Virus', management: 'Use virus-free seedlings; control aphid vectors with neem oil' },
      { name: 'Fruit Fly', management: 'Use protein bait traps; harvest fruit promptly when ripe' }
    ]
  },
  'Dragon Fruit': {
    plantingSeasons: ['April-June'],
    daysToMaturity: 365,
    harvestSeasons: ['May-October (Summer peak)'],
    yieldPeriod: 'Perennial (20+ years productive)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Install night lighting to extend flowering season',
      'Provide sturdy concrete posts — each plant can produce 50kg/year',
      'Hand-pollinate at night when flowers open for better fruit set'
    ],
    commonPests: [
      { name: 'Anthracnose', management: 'Apply copper fungicide; improve air circulation between plants' },
      { name: 'Mealybug', management: 'Use insecticidal soap or neem oil; introduce natural predators' }
    ]
  },
  'Guava': {
    plantingSeasons: ['March-April', 'August-September'],
    daysToMaturity: 365,
    harvestSeasons: ['Year-round with peaks in Summer and Winter'],
    yieldPeriod: 'Perennial (15-20 years productive)',
    soilPH: { min: 5.0, max: 7.0 },
    bestPractices: [
      'Bag fruits when young to protect from fruit flies',
      'Prune regularly to maintain manageable height',
      'Thin fruits to 1-2 per cluster for larger size'
    ],
    commonPests: [
      { name: 'Fruit Fly', management: 'Bag fruits at marble stage; use protein bait traps' },
      { name: 'Guava Wilt', management: 'Remove infected trees; improve drainage; use resistant varieties' }
    ]
  },
  'Papaya': {
    plantingSeasons: ['February-March', 'August-September'],
    daysToMaturity: 270,
    harvestSeasons: ['Year-round after establishment'],
    yieldPeriod: 'Perennial (3-4 years then replant)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Plant 2-3 seeds per hole and thin to strongest plant',
      'Ensure excellent drainage — papaya is sensitive to waterlogging',
      'Replace plants every 3-4 years as yield declines'
    ],
    commonPests: [
      { name: 'Papaya Ringspot Virus', management: 'Use virus-resistant varieties; control aphid vectors' },
      { name: 'Fruit Fly', management: 'Bag fruits; use methyl eugenol traps for male flies' }
    ]
  },
  'Pineapple': {
    plantingSeasons: ['January-March', 'July-September'],
    daysToMaturity: 540,
    harvestSeasons: ['Year-round — can be induced with ethephon'],
    yieldPeriod: 'Ratoon crops for 2-3 cycles then replant',
    soilPH: { min: 4.5, max: 6.5 },
    bestPractices: [
      'Use ethephon spray to synchronise flowering for market timing',
      'Remove ratoon shoots leaving only 1-2 per plant after harvest',
      'Apply plastic mulch to suppress weeds and conserve moisture'
    ],
    commonPests: [
      { name: 'Mealybug Wilt', management: 'Control mealybugs with insecticide; use clean planting material' },
      { name: 'Heart Rot', management: 'Treat crowns and slips with fungicide before planting' }
    ]
  },
  'Mango': {
    plantingSeasons: ['March-April'],
    daysToMaturity: 1825,
    harvestSeasons: ['May-August (Summer)'],
    yieldPeriod: 'Perennial (30-40 years productive)',
    soilPH: { min: 5.5, max: 7.5 },
    bestPractices: [
      'Apply potassium nitrate spray to induce uniform flowering',
      'Bag fruits at marble stage to prevent fruit fly damage',
      'Prune after harvest to shape tree and improve light penetration'
    ],
    commonPests: [
      { name: 'Fruit Fly', management: 'Bag fruits; use methyl eugenol traps; harvest promptly' },
      { name: 'Powdery Mildew', management: 'Apply sulphur fungicide at flower bud stage' }
    ]
  },
  'Longan': {
    plantingSeasons: ['February-March'],
    daysToMaturity: 1825,
    harvestSeasons: ['July-August (Summer)'],
    yieldPeriod: 'Perennial (50+ years productive)',
    soilPH: { min: 5.5, max: 6.5 },
    bestPractices: [
      'Apply potassium chlorate to induce flowering in off-season',
      'Thin fruit clusters to improve individual fruit size',
      'Harvest by whole clusters when skin turns yellowish-brown'
    ],
    commonPests: [
      { name: 'Stink Bug', management: 'Use pheromone traps; net young fruit clusters if severe' },
      { name: 'Leaf Blight', management: 'Improve air circulation; apply copper fungicide in wet weather' }
    ]
  },
  'Lychee': {
    plantingSeasons: ['February-March'],
    daysToMaturity: 1825,
    harvestSeasons: ['May-July (Summer)'],
    yieldPeriod: 'Perennial (50+ years productive)',
    soilPH: { min: 5.0, max: 6.0 },
    bestPractices: [
      'Ring-bark branches in winter to induce better flowering',
      'Protect developing fruit from birds with netting',
      'Cool storage immediately after harvest to maintain quality'
    ],
    commonPests: [
      { name: 'Erinose Mite', management: 'Apply sulphur or miticide at bud break; remove affected leaves' },
      { name: 'Fruit Borer', management: 'Remove fallen fruits; apply insecticide at fruit set' }
    ]
  },
  'Persimmon': {
    plantingSeasons: ['February-March'],
    daysToMaturity: 1460,
    harvestSeasons: ['October-December (Autumn-Winter)'],
    yieldPeriod: 'Perennial (50+ years productive)',
    soilPH: { min: 6.0, max: 7.5 },
    bestPractices: [
      'Thin fruit to 1 per cluster for large premium fruit',
      'Allow astringent varieties to soften naturally or treat with CO2',
      'Prune to vase shape for easy harvesting and light penetration'
    ],
    commonPests: [
      { name: 'Powdery Mildew', management: 'Apply sulphur fungicide; improve air circulation' },
      { name: 'Scale Insects', management: 'Apply dormant oil spray in winter; use systemic insecticide if severe' }
    ]
  },
  'Plum': {
    plantingSeasons: ['January-February'],
    daysToMaturity: 1460,
    harvestSeasons: ['June-August (Summer)'],
    yieldPeriod: 'Perennial (20-30 years productive)',
    soilPH: { min: 5.5, max: 6.5 },
    bestPractices: [
      'Requires 500-800 chilling hours below 7 degrees for good flowering',
      'Plant 2 varieties for cross-pollination to improve fruit set',
      'Thin fruits to 10-15cm spacing for larger size'
    ],
    commonPests: [
      { name: 'Brown Rot', management: 'Apply fungicide at bloom and preharvest; remove mummified fruits' },
      { name: 'Aphids', management: 'Use insecticidal soap early season; encourage natural predators' }
    ]
  },
  'Cabbage': {
    plantingSeasons: ['September-November', 'February-March'],
    daysToMaturity: 90,
    harvestSeasons: ['December-March (Winter)', 'May-June (Spring)'],
    yieldPeriod: 'Annual (2 crops per year possible)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Transplant seedlings at 4-6 true leaf stage',
      'Apply nitrogen fertiliser at transplanting and head initiation',
      'Harvest before heads crack — slight give when pressed indicates readiness'
    ],
    commonPests: [
      { name: 'Cabbage Moth', management: 'Apply Bt spray; use pheromone traps' },
      { name: 'Club Root', management: 'Lime soil to pH 7+; rotate crops; use resistant varieties' }
    ]
  },
  'Chinese Cabbage': {
    plantingSeasons: ['August-October', 'February-March'],
    daysToMaturity: 70,
    harvestSeasons: ['October-January (Autumn-Winter)', 'April-May (Spring)'],
    yieldPeriod: 'Annual (multiple crops per year)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Direct sow or transplant at 30x40cm spacing',
      'Keep soil consistently moist for tender leaves',
      'Harvest entire head when firm and before bolting'
    ],
    commonPests: [
      { name: 'Flea Beetle', management: 'Use row covers; apply kaolin clay; rotate crops' },
      { name: 'Downy Mildew', management: 'Improve air circulation; apply copper fungicide preventatively' }
    ]
  },
  'Tomato': {
    plantingSeasons: ['February-March', 'August-September'],
    daysToMaturity: 90,
    harvestSeasons: ['May-July', 'November-January'],
    yieldPeriod: 'Annual (2 crops per year)',
    soilPH: { min: 6.0, max: 6.8 },
    bestPractices: [
      'Stake or cage plants early to support heavy fruit load',
      'Remove suckers weekly to direct energy to fruit production',
      'Water consistently to prevent blossom end rot and cracking'
    ],
    commonPests: [
      { name: 'Late Blight', management: 'Apply copper fungicide preventatively; improve air circulation' },
      { name: 'Tomato Fruit Worm', management: 'Apply Bt spray at egg hatch; use pheromone traps' }
    ]
  },
  'Bell Pepper': {
    plantingSeasons: ['February-March', 'August-September'],
    daysToMaturity: 90,
    harvestSeasons: ['May-August', 'November-February'],
    yieldPeriod: 'Annual (2 crops per year)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Start seeds indoors 8-10 weeks before transplanting',
      'Mulch to maintain soil moisture and temperature',
      'Pick green peppers to encourage continued production'
    ],
    commonPests: [
      { name: 'Pepper Weevil', management: 'Remove infested fruits; apply pyrethrin spray' },
      { name: 'Anthracnose', management: 'Use disease-free seed; apply copper fungicide in wet weather' }
    ]
  },
  'Cucumber': {
    plantingSeasons: ['March-April', 'August-September'],
    daysToMaturity: 55,
    harvestSeasons: ['May-July', 'October-December'],
    yieldPeriod: 'Annual (2 crops per year)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Provide trellis support for vertical growing to save space',
      'Harvest every 2-3 days to encourage continued production',
      'Keep soil consistently moist — uneven watering causes bitter fruit'
    ],
    commonPests: [
      { name: 'Powdery Mildew', management: 'Apply sulphur or potassium bicarbonate spray; improve air flow' },
      { name: 'Cucumber Beetle', management: 'Use row covers early; apply pyrethrin if severe' }
    ]
  },
  'Eggplant': {
    plantingSeasons: ['February-March', 'August-September'],
    daysToMaturity: 80,
    harvestSeasons: ['May-October', 'November-February'],
    yieldPeriod: 'Annual (can ratoon for second season)',
    soilPH: { min: 5.5, max: 6.8 },
    bestPractices: [
      'Stake plants to support heavy fruit — can produce 20kg+ per plant',
      'Harvest when skin is glossy — overripe fruit becomes bitter',
      'Prune to 3-4 main branches for better fruit quality'
    ],
    commonPests: [
      { name: 'Eggplant Lace Bug', management: 'Apply neem oil or insecticidal soap to leaf undersides' },
      { name: 'Phomopsis Blight', management: 'Use disease-free seed; apply mancozeb fungicide' }
    ]
  },
  'Sweet Potato': {
    plantingSeasons: ['March-May'],
    daysToMaturity: 120,
    harvestSeasons: ['August-October'],
    yieldPeriod: 'Annual',
    soilPH: { min: 5.5, max: 6.5 },
    bestPractices: [
      'Plant vine cuttings rather than tubers for disease-free start',
      'Avoid nitrogen-heavy fertiliser — encourages vines over tubers',
      'Cure harvested roots at 30C for 1 week to improve shelf life'
    ],
    commonPests: [
      { name: 'Sweet Potato Weevil', management: 'Use clean planting material; crop rotation; destroy crop residues' },
      { name: 'Scurf', management: 'Use disease-free slips; rotate with non-susceptible crops' }
    ]
  },
  'Taro': {
    plantingSeasons: ['March-April'],
    daysToMaturity: 210,
    harvestSeasons: ['October-December'],
    yieldPeriod: 'Annual',
    soilPH: { min: 5.5, max: 7.0 },
    bestPractices: [
      'Plant in moist humus-rich soil with good water retention',
      'Maintain consistent soil moisture throughout growing season',
      'Harvest when lower leaves yellow and stems begin to dry'
    ],
    commonPests: [
      { name: 'Taro Leaf Blight', management: 'Apply copper fungicide; improve drainage; avoid overhead irrigation' },
      { name: 'Aphids', management: 'Use reflective mulch; apply neem oil spray' }
    ]
  },
  'Bamboo Shoots': {
    plantingSeasons: ['February-March (rhizome division)'],
    daysToMaturity: 365,
    harvestSeasons: ['January-March (Moso)', 'April-June (other varieties)'],
    yieldPeriod: 'Perennial (indefinite once established)',
    soilPH: { min: 5.5, max: 7.0 },
    bestPractices: [
      'Harvest shoots when 15-30cm above ground for best tenderness',
      'Blanch immediately after harvest to preserve freshness',
      'Leave 30-40% of shoots to grow into culms for grove renewal'
    ],
    commonPests: [
      { name: 'Bamboo Mite', management: 'Apply miticide in summer; improve air circulation' },
      { name: 'Shoot Fly', management: 'Harvest shoots promptly; apply insecticide if severe infestation' }
    ]
  },
  'Radish': {
    plantingSeasons: ['September-November', 'February-March'],
    daysToMaturity: 60,
    harvestSeasons: ['November-February', 'April-May'],
    yieldPeriod: 'Annual (multiple crops per year)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Direct sow — radishes do not transplant well',
      'Thin to 10-15cm spacing for large root development',
      'Harvest promptly at maturity — over-mature roots become pithy'
    ],
    commonPests: [
      { name: 'Root Maggot', management: 'Use row covers; apply beneficial nematodes to soil' },
      { name: 'Flea Beetle', management: 'Use row covers early season; apply kaolin clay spray' }
    ]
  },
  'Lettuce': {
    plantingSeasons: ['September-November', 'February-March'],
    daysToMaturity: 60,
    harvestSeasons: ['November-March'],
    yieldPeriod: 'Annual (multiple crops per year)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Sow succession crops every 2-3 weeks for continuous harvest',
      'Harvest in the morning when leaves are crispest',
      'Provide shade cloth in warm weather to prevent bolting'
    ],
    commonPests: [
      { name: 'Slugs and Snails', management: 'Use iron phosphate bait; set beer traps; avoid evening watering' },
      { name: 'Tip Burn', management: 'Increase calcium; improve air circulation; avoid calcium deficiency' }
    ]
  },
  'Basil': {
    plantingSeasons: ['March-May', 'August-September'],
    daysToMaturity: 60,
    harvestSeasons: ['May-October'],
    yieldPeriod: 'Annual (replant each season)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Pinch flowers immediately to extend leaf production',
      'Harvest from top — promotes bushy growth',
      'Never refrigerate fresh basil — store at room temperature in water'
    ],
    commonPests: [
      { name: 'Fusarium Wilt', management: 'Use disease-resistant varieties; avoid overwatering; rotate crops' },
      { name: 'Aphids', management: 'Spray with water jet; apply neem oil; encourage ladybirds' }
    ]
  },
  'Lemongrass': {
    plantingSeasons: ['March-May'],
    daysToMaturity: 90,
    harvestSeasons: ['Year-round after establishment'],
    yieldPeriod: 'Perennial (3-5 years before replanting)',
    soilPH: { min: 5.0, max: 8.0 },
    bestPractices: [
      'Divide clumps every 2-3 years to maintain vigour',
      'Harvest outer stalks when 30cm+ tall leaving inner growth',
      'Dry excess harvest for tea market — premium price product'
    ],
    commonPests: [
      { name: 'Rust', management: 'Improve air circulation; apply mancozeb fungicide if severe' },
      { name: 'Shoot Fly', management: 'Remove infected shoots; apply neem oil preventatively' }
    ]
  },
  'Mint': {
    plantingSeasons: ['March-April', 'September-October'],
    daysToMaturity: 45,
    harvestSeasons: ['Year-round after establishment'],
    yieldPeriod: 'Perennial (harvest year-round)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Contain in pots or use root barriers — mint spreads aggressively',
      'Harvest before flowering for best flavour and oil content',
      'Cut back to 5cm after flowering to rejuvenate growth'
    ],
    commonPests: [
      { name: 'Mint Rust', management: 'Remove infected stems; apply sulphur fungicide; use disease-free stock' },
      { name: 'Spider Mite', management: 'Spray water on leaf undersides; apply neem oil in dry weather' }
    ]
  },
  'Green Onion': {
    plantingSeasons: ['Year-round (best March-April and September-October)'],
    daysToMaturity: 60,
    harvestSeasons: ['Year-round'],
    yieldPeriod: 'Annual (multiple crops per year)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Direct sow thickly then thin — thinnings are edible',
      'Blanch stalks by hilling soil around base for white stems',
      'Harvest entire plant or cut and come again for continuous supply'
    ],
    commonPests: [
      { name: 'Onion Thrips', management: 'Apply spinosad or neem oil; use reflective mulch' },
      { name: 'Purple Blotch', management: 'Apply mancozeb fungicide; improve air circulation' }
    ]
  },
  'Coriander': {
    plantingSeasons: ['September-November', 'February-March'],
    daysToMaturity: 45,
    harvestSeasons: ['November-May (cool season)'],
    yieldPeriod: 'Annual (quick succession sowings)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Sow succession crops every 2-3 weeks — bolts quickly in heat',
      'Crush seeds before sowing to improve germination',
      'Harvest leaves before plant bolts for best flavour'
    ],
    commonPests: [
      { name: 'Aphids', management: 'Apply insecticidal soap; encourage natural predators' },
      { name: 'Powdery Mildew', management: 'Improve air circulation; apply potassium bicarbonate spray' }
    ]
  },
  'Apple (Fuji)': {
    plantingSeasons: ['January-February (bare root)'],
    daysToMaturity: 1825,
    harvestSeasons: ['September-November (Autumn)'],
    yieldPeriod: 'Perennial (30-40 years productive)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Requires 800-1200 chilling hours below 7C — high altitude essential',
      'Thin fruits to 1 per cluster at marble size for premium grade',
      'Bag individual fruits at marble stage to prevent pest damage'
    ],
    commonPests: [
      { name: 'Apple Scab', management: 'Apply fungicide at green tip; use scab-resistant varieties' },
      { name: 'Codling Moth', management: 'Use pheromone traps; apply kaolin clay; bag fruits' }
    ]
  },
  'Peach': {
    plantingSeasons: ['January-February (bare root)'],
    daysToMaturity: 1095,
    harvestSeasons: ['June-August (Summer)'],
    yieldPeriod: 'Perennial (15-20 years productive)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Requires 700-1000 chilling hours — plant at 1200m+ in Taiwan',
      'Thin fruits aggressively to 15-20cm spacing for large premium fruit',
      'Open-centre pruning to maximise light penetration and air circulation'
    ],
    commonPests: [
      { name: 'Brown Rot', management: 'Apply fungicide at bloom and preharvest; remove mummified fruits' },
      { name: 'Oriental Fruit Moth', management: 'Use pheromone traps; apply spinosad at egg hatch' }
    ]
  },
  'Grape': {
    plantingSeasons: ['January-February (dormant cuttings)'],
    daysToMaturity: 730,
    harvestSeasons: ['July-September (Summer)'],
    yieldPeriod: 'Perennial (30-40 years productive)',
    soilPH: { min: 5.5, max: 7.0 },
    bestPractices: [
      'Train on overhead trellis system for best light interception',
      'Thin bunches to 8-12 per vine for premium quality fruit',
      'Bag bunches at pea size to prevent bird and pest damage'
    ],
    commonPests: [
      { name: 'Downy Mildew', management: 'Apply copper fungicide preventatively in wet weather; improve air flow' },
      { name: 'Japanese Beetle', management: 'Hand-pick adults; apply neem oil; use pheromone traps' }
    ]
  },
  'Sweet Corn': {
    plantingSeasons: ['March-April', 'August-September'],
    daysToMaturity: 80,
    harvestSeasons: ['June-July', 'November-December'],
    yieldPeriod: 'Annual (2 crops per year)',
    soilPH: { min: 5.8, max: 7.0 },
    bestPractices: [
      'Plant in blocks of 4+ rows for good pollination',
      'Harvest when silk turns dark brown and kernel juice is milky',
      'Process or refrigerate immediately after harvest'
    ],
    commonPests: [
      { name: 'Corn Earworm', management: 'Apply Bt or spinosad to silk at silking stage' },
      { name: 'Fall Armyworm', management: 'Scout regularly; apply Bt or spinosad at early instar stage' }
    ]
  },
  'Strawberry': {
    plantingSeasons: ['September-October'],
    daysToMaturity: 120,
    harvestSeasons: ['December-April (Winter-Spring)'],
    yieldPeriod: 'Annual (replace runners annually)',
    soilPH: { min: 5.5, max: 6.5 },
    bestPractices: [
      'Use certified virus-free runners for planting',
      'Apply plastic mulch to keep fruits clean and soil warm',
      'Remove runners during fruiting to direct energy to fruit'
    ],
    commonPests: [
      { name: 'Gray Mold', management: 'Improve air circulation; apply fungicide at flowering; remove infected fruit' },
      { name: 'Spider Mite', management: 'Apply miticide; maintain high humidity; introduce predatory mites' }
    ]
  },
  'Mountain Rice': {
    plantingSeasons: ['April-May'],
    daysToMaturity: 150,
    harvestSeasons: ['September-October'],
    yieldPeriod: 'Annual',
    soilPH: { min: 5.5, max: 6.5 },
    bestPractices: [
      'Sow on contoured terraces to prevent soil erosion on slopes',
      'Use traditional varieties adapted to highland conditions',
      'Dry harvested grain to 14% moisture before storage'
    ],
    commonPests: [
      { name: 'Rice Blast', management: 'Use resistant varieties; apply tricyclazole fungicide at tillering' },
      { name: 'Brown Planthopper', management: 'Avoid excessive nitrogen; apply insecticide at nymph stage' }
    ]
  },
  'Broccoli': {
    plantingSeasons: ['August-October'],
    daysToMaturity: 80,
    harvestSeasons: ['November-February (Winter)'],
    yieldPeriod: 'Annual',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Transplant seedlings when 15-20cm tall into firm fertile soil',
      'Side-dress with nitrogen fertiliser at head initiation',
      'Harvest main head before flowers open — side shoots continue for weeks'
    ],
    commonPests: [
      { name: 'Cabbage Moth', management: 'Apply Bt spray weekly from transplanting; use pheromone traps' },
      { name: 'Downy Mildew', management: 'Apply copper fungicide; ensure good drainage; avoid overhead watering' }
    ]
  },
  'Jin Xuan Tea': {
    plantingSeasons: ['February-March', 'September-October'],
    daysToMaturity: 730,
    harvestSeasons: ['April-May (Spring)', 'October-November (Winter)'],
    yieldPeriod: 'Perennial (30+ years productive)',
    soilPH: { min: 4.5, max: 6.0 },
    bestPractices: [
      'Harvest only top 1-2 leaves and bud for milky oolong character',
      'Light withering indoors 4-6 hours to develop characteristic aroma',
      'Process promptly after harvest for best flavour development'
    ],
    commonPests: [
      { name: 'Tea Green Leafhopper', management: 'Monitor levels; slight damage creates natural bug-bitten character' },
      { name: 'Anthracnose', management: 'Apply copper fungicide in wet season; improve drainage' }
    ]
  },
  'Shiitake Mushroom': {
    plantingSeasons: ['October-February (log inoculation)'],
    daysToMaturity: 180,
    harvestSeasons: ['Year-round after log maturation'],
    yieldPeriod: '3-5 years per log before exhaustion',
    soilPH: { min: 5.5, max: 6.5 },
    bestPractices: [
      'Use fresh-cut oak or other hardwood logs 10-20cm diameter',
      'Inoculate logs within 2 weeks of cutting before contamination',
      'Soak logs in cold water for 24 hours to trigger fruiting flush'
    ],
    commonPests: [
      { name: 'Green Mold', management: 'Use clean logs; maintain sterile inoculation; ensure good ventilation' },
      { name: 'Slugs and Snails', management: 'Set beer traps; use iron phosphate bait around growing area' }
    ]
  },
  'Chrysanthemum': {
    plantingSeasons: ['July-August'],
    daysToMaturity: 120,
    harvestSeasons: ['November-January (Autumn-Winter)'],
    yieldPeriod: 'Annual (replant cuttings each season)',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Use blackout curtains or supplemental lighting to control flowering time',
      'Pinch growing tip once at 15cm to promote bushy growth',
      'Harvest flowers when 2/3 open for longest vase life'
    ],
    commonPests: [
      { name: 'Aphids', management: 'Apply insecticidal soap or neem oil; encourage natural predators' },
      { name: 'Botrytis Blight', management: 'Improve air circulation; apply fungicide; remove dead plant material' }
    ]
  },
  'Alpine Garlic': {
    plantingSeasons: ['October-November'],
    daysToMaturity: 210,
    harvestSeasons: ['May-June (Summer)'],
    yieldPeriod: 'Annual',
    soilPH: { min: 6.0, max: 7.0 },
    bestPractices: [
      'Plant cloves pointed end up 5cm deep and 15cm apart',
      'Remove flower scapes to direct energy to bulb',
      'Cure harvested bulbs in warm dry place for 3-4 weeks'
    ],
    commonPests: [
      { name: 'White Rot', management: 'Crop rotation minimum 8 years; use clean planting stock; improve drainage' },
      { name: 'Thrips', management: 'Apply spinosad or neem oil; maintain good irrigation to reduce stress' }
    ]
  }
};

async function applyPatch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agrioptimizer');
    console.log('✅ MongoDB Connected');

    let updated = 0;
    let notFound = 0;

    for (const [name, data] of Object.entries(timelineData)) {
      const result = await Crop.findOneAndUpdate(
        { name_en: name },
        { $set: data },
        { new: true }
      );

      if (result) {
        console.log(`✅ Updated: ${name}`);
        updated++;
      } else {
        console.log(`⚠️  Not found: ${name}`);
        notFound++;
      }
    }

    console.log('\n========================================');
    console.log(`✅ Updated: ${updated} crops`);
    console.log(`⚠️  Not found: ${notFound} crops`);
    console.log('========================================');

    await mongoose.disconnect();
    console.log('Done! Run npm run dev to see changes.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

applyPatch();