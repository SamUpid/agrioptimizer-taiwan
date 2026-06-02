/**
 * Altitude Lookup Table
 * Maps elevation zones to recommended crops and coffee varieties
 * for Taiwan's mountain farming regions (Alishan focus)
 *
 * Usage:
 *   const { getRecommendations } = require('./data/altitudeLookup');
 *   const { zone, crops, coffees } = getRecommendations(1600);
 *
 * Zones:
 *   lowland  200–800m
 *   mid      800–1200m
 *   high     1200–1800m
 *   alpine   1800m+
 *
 * NOTE: imageUrl values are Unsplash links added manually by project owner.
 *       Do NOT auto-generate these — always get from owner when adding new crops.
 */

const ALTITUDE_ZONES = {

  // ── LOWLAND: 200–800m ─────────────────────────────────────
  lowland: {
    range: { min: 200, max: 800 },
    label: 'Lowland Hills',
    labelZh: '低山丘陵',
    description: 'Warm, humid conditions suitable for tropical and subtropical crops',
    descriptionZh: '溫暖潮濕，適合熱帶及亞熱帶作物',

    crops: [
      {
        cropName: 'Dragon Fruit',
        cropNameZh: '火龍果',
        imageUrl: 'https://images.unsplash.com/photo-1552654181-4072dde6e17b?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 94,
        reason: 'Thrives in Taiwan\'s warm lowland climate, heat-tolerant and high-yield',
        reasonZh: '適合台灣低地溫暖氣候，耐熱且高產'
      },
      {
        cropName: 'Papaya',
        cropNameZh: '木瓜',
        imageUrl: 'https://images.unsplash.com/photo-1664183237682-1987fa120fd2?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 90,
        reason: 'Prefers temperatures above 18°C, ideal below 600m',
        reasonZh: '喜歡18°C以上的氣溫，600公尺以下最佳'
      },
      {
        cropName: 'Pineapple',
        cropNameZh: '鳳梨',
        imageUrl: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 88,
        reason: 'Taiwan\'s famous lowland fruit crop, heat-loving',
        reasonZh: '台灣著名的低地果品，喜熱'
      },
      {
        cropName: 'Grape',
        cropNameZh: '葡萄',
        imageUrl: 'https://images.unsplash.com/photo-1599989317399-2a6e074c6555?q=80&w=2274&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 86,
        reason: 'Taiwan\'s Xinpu and Houli grapes grow well in warm lowland valleys',
        reasonZh: '台灣新埔和后里葡萄在溫暖低地山谷生長良好'
      },
      {
        cropName: 'Strawberry',
        cropNameZh: '草莓',
        imageUrl: 'https://images.unsplash.com/photo-1694632872166-c7ae400a5087?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 85,
        reason: 'Dahu strawberries thrive at 300–800m, iconic Taiwan crop',
        reasonZh: '大湖草莓在300–800公尺茁壯，台灣標誌性作物'
      },
      {
        cropName: 'Sweet Corn',
        cropNameZh: '甜玉米',
        imageUrl: 'https://images.unsplash.com/photo-1567547921486-f280c2f53b5d?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 84,
        reason: 'Fast-growing cash crop well-suited to lowland warm conditions',
        reasonZh: '快速生長的現金作物，適合低地溫暖環境'
      },
      {
        cropName: 'Taro',
        cropNameZh: '芋頭',
        imageUrl: 'https://images.unsplash.com/photo-1656252793220-58e3fe34110f?q=80&w=2036&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 83,
        reason: 'Grows well in moist lowland soils up to 800m',
        reasonZh: '在800公尺以下潮濕低地土壤中生長良好'
      },
      {
        cropName: 'Lemongrass',
        cropNameZh: '檸檬香茅',
        imageUrl: 'https://images.unsplash.com/photo-1524641619328-f3b7444f7afa?q=80&w=1022&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 80,
        reason: 'Aromatic herb crop suited to lowland tropical conditions',
        reasonZh: '適合低地熱帶氣候的芳香草藥作物'
      }
    ],

    coffees: [
      {
        coffeeName: 'Catuai Coffee',
        coffeeNameZh: '卡杜艾咖啡',
        imageUrl: 'https://images.unsplash.com/photo-1662559102063-a665b04771fd?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'Catuai',
        suitabilityScore: 82,
        reason: 'Wind-resistant, high-yield variety suited to Taiwan\'s lower elevations',
        reasonZh: '抗風且高產，適合台灣較低海拔的品種'
      },
      {
        coffeeName: 'Caturra Coffee',
        coffeeNameZh: '卡杜拉咖啡',
        imageUrl: 'https://images.unsplash.com/photo-1550955731-5a4cfd898f64?q=80&w=1365&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'Caturra',
        suitabilityScore: 75,
        reason: 'Compact variety possible at upper lowland range (600–800m) with shade',
        reasonZh: '在600–800公尺遮陰條件下可種植的矮種'
      }
    ]
  },

  // ── MID: 800–1200m ────────────────────────────────────────
  mid: {
    range: { min: 800, max: 1200 },
    label: 'Mid-Altitude Hills',
    labelZh: '中海拔丘陵',
    description: 'Mild temperatures with seasonal variation, excellent for tea and specialty crops',
    descriptionZh: '氣溫溫和，季節變化明顯，適合茶葉和特色作物',

    crops: [
      {
        cropName: 'Tea (High Mountain Oolong)',
        cropNameZh: '烏龍茶',
        imageUrl: 'https://images.unsplash.com/photo-1743401404293-0734bb7b5a42?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 94,
        reason: 'Classic Taiwan mid-altitude tea, ideal 800–1200m',
        reasonZh: '台灣經典中海拔茶，800–1200公尺最佳'
      },
      {
        cropName: 'Bamboo Shoots',
        cropNameZh: '竹筍',
        imageUrl: 'https://images.unsplash.com/photo-1680612768519-b48fae346288?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 90,
        reason: 'Moso bamboo thrives in mid-altitude cool humid conditions',
        reasonZh: '孟宗竹在中海拔涼爽潮濕環境中茂盛'
      },
      {
        cropName: 'Sweet Corn',
        cropNameZh: '甜玉米',
        imageUrl: 'https://images.unsplash.com/photo-1567547921486-f280c2f53b5d?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 88,
        reason: 'Cool temperatures at 800–1200m produce exceptionally sweet corn',
        reasonZh: '800–1200公尺的涼爽氣溫孕育特別甜的玉米'
      },
      {
        cropName: 'Mountain Rice',
        cropNameZh: '山地米',
        imageUrl: 'https://images.unsplash.com/photo-1508043157312-69e4bf3dd28c?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 86,
        reason: 'Highland indigenous rice grows well at mid-altitude with good rainfall',
        reasonZh: '高地原住民水稻在中海拔充足降雨中生長良好'
      },
      {
        cropName: 'Shiitake Mushroom',
        cropNameZh: '香菇',
        imageUrl: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?q=80&w=2080&auto=format&fit=crop',
        suitabilityScore: 88,
        reason: 'Cool moist mid-altitude conditions perfect for log cultivation',
        reasonZh: '涼爽潮濕的中海拔環境非常適合段木栽培'
      },
      {
        cropName: 'Cabbage',
        cropNameZh: '高麗菜',
        imageUrl: 'https://images.unsplash.com/photo-1579584705540-46ebde56da8d?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 87,
        reason: 'Cool temperatures enhance sweetness and crunch at mid-altitude',
        reasonZh: '中海拔涼爽氣溫提升甜度和口感'
      },
      {
        cropName: 'Broccoli',
        cropNameZh: '青花菜',
        imageUrl: 'https://images.unsplash.com/photo-1606585333304-a7fa1ca4376c?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 86,
        reason: 'Major Taiwan export vegetable, thrives in cool mid-altitude conditions',
        reasonZh: '台灣主要出口蔬菜，在涼爽的中海拔環境茁壯'
      },
      {
        cropName: 'Plum',
        cropNameZh: '李子',
        imageUrl: 'https://images.unsplash.com/photo-1690233319569-0ca9a8538fee?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 84,
        reason: 'Traditional mid-altitude Taiwan fruit, chilling requirement met',
        reasonZh: '傳統中海拔台灣水果，滿足需冷量'
      }
    ],

    coffees: [
      {
        coffeeName: 'Taiwan Arabica',
        coffeeNameZh: '台灣阿拉比卡',
        imageUrl: 'https://images.unsplash.com/photo-1586095516671-d085ff58cdd4?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'Arabica',
        suitabilityScore: 90,
        reason: 'Ideal starting altitude for quality Arabica in Taiwan',
        reasonZh: '台灣優質阿拉比卡的理想起始海拔'
      },
      {
        coffeeName: 'Typica Coffee',
        coffeeNameZh: '鐵比卡咖啡',
        imageUrl: 'https://images.unsplash.com/photo-1586095516671-d085ff58cdd4?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'Typica',
        suitabilityScore: 86,
        reason: 'Classic Arabica variety well-suited to Taiwan\'s mid-altitude climate',
        reasonZh: '適合台灣中海拔氣候的經典阿拉比卡品種'
      },
      {
        coffeeName: 'Caturra Coffee',
        coffeeNameZh: '卡杜拉咖啡',
        imageUrl: 'https://images.unsplash.com/photo-1550955731-5a4cfd898f64?q=80&w=1365&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'Caturra',
        suitabilityScore: 83,
        reason: 'Compact variety productive at mid-altitude with good cup quality',
        reasonZh: '中海拔產量高且杯測品質佳的矮種'
      },
      {
        coffeeName: 'Catuai Coffee',
        coffeeNameZh: '卡杜艾咖啡',
        imageUrl: 'https://images.unsplash.com/photo-1662559102063-a665b04771fd?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'Catuai',
        suitabilityScore: 82,
        reason: 'Wind-resistant and high-yielding, excellent for Taiwan beginners',
        reasonZh: '抗風且高產，非常適合台灣初學者'
      }
    ]
  },

  // ── HIGH: 1200–1800m ──────────────────────────────────────
  high: {
    range: { min: 1200, max: 1800 },
    label: 'High Mountain',
    labelZh: '高山',
    description: 'Alishan heartland — cool misty conditions produce premium crops',
    descriptionZh: '阿里山核心地帶——涼爽雲霧環境孕育頂級作物',

    crops: [
      {
        cropName: 'Tea (High Mountain Oolong)',
        cropNameZh: '高山烏龍茶',
        imageUrl: 'https://images.unsplash.com/photo-1743401404293-0734bb7b5a42?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 98,
        reason: 'Premium Alishan oolong zone — slow growth in mist creates complex flavour',
        reasonZh: '阿里山頂級烏龍產區——雲霧中慢速生長形成複雜風味'
      },
      {
        cropName: 'Apple (Fuji)',
        cropNameZh: '富士蘋果',
        imageUrl: 'https://images.unsplash.com/photo-1600917016506-556622b74303?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 95,
        reason: 'Lishan Fuji apples thrive at 1200–2000m — Taiwan\'s most prized apple region',
        reasonZh: '梨山富士蘋果在1200–2000公尺茁壯——台灣最珍貴的蘋果產區'
      },
      {
        cropName: 'Peach',
        cropNameZh: '水蜜桃',
        imageUrl: 'https://images.unsplash.com/photo-1590123471813-366f7ac75045?q=80&w=1288&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 94,
        reason: 'Wuling Farm peaches are world-famous — 1500–2000m gives them exceptional sweetness',
        reasonZh: '武陵農場水蜜桃世界知名——1500–2000公尺賦予極致甜度'
      },
      {
        cropName: 'Jin Xuan Tea',
        cropNameZh: '金萱茶',
        imageUrl: 'https://images.unsplash.com/photo-1743401404293-0734bb7b5a42?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 93,
        reason: 'Taiwan\'s signature milky oolong thrives in cool mountain mist',
        reasonZh: '台灣奶香烏龍在涼爽山霧中茁壯'
      },
      {
        cropName: 'Alpine Cabbage',
        cropNameZh: '高山甘藍',
        imageUrl: 'https://images.unsplash.com/photo-1579584705540-46ebde56da8d?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 90,
        reason: 'Cool temperatures concentrate sugars for exceptional flavour',
        reasonZh: '低溫使糖分集中，風味出色'
      },
      {
        cropName: 'Broccoli',
        cropNameZh: '青花菜',
        imageUrl: 'https://images.unsplash.com/photo-1606585333304-a7fa1ca4376c?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 88,
        reason: 'High-altitude broccoli has premium quality and strong export demand',
        reasonZh: '高海拔青花菜品質頂級，出口需求強勁'
      },
      {
        cropName: 'Cherry Tomato',
        cropNameZh: '高山小番茄',
        imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 87,
        reason: 'High-altitude cherry tomatoes are prized for sweetness in Taiwan',
        reasonZh: '高山小番茄以甜度著稱，深受市場青睞'
      },
      {
        cropName: 'Alpine Strawberry',
        cropNameZh: '高山草莓',
        imageUrl: 'https://images.unsplash.com/photo-1694632872166-c7ae400a5087?q=80&w=1335&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 85,
        reason: 'Cool nights and warm days create exceptional flavour at altitude',
        reasonZh: '晝暖夜涼的高山氣候造就出色風味'
      }
    ],

    coffees: [
      {
        coffeeName: 'Geisha Coffee',
        coffeeNameZh: '藝妓咖啡',
        imageUrl: 'https://images.unsplash.com/photo-1755601920093-5749b15ce893?q=80&w=2274&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'Geisha',
        suitabilityScore: 96,
        reason: 'Geisha reaches peak expression at 1200–1800m — floral and complex',
        reasonZh: '藝妓在1200–1800公尺達到巔峰——花香複雜'
      },
      {
        coffeeName: 'Bourbon Coffee',
        coffeeNameZh: '波旁咖啡',
        imageUrl: 'https://images.unsplash.com/photo-1694558334826-a371e09fae1d?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'Bourbon',
        suitabilityScore: 93,
        reason: 'Sweet and balanced, thrives in high-altitude cool conditions',
        reasonZh: '甜潤均衡，在高海拔涼爽環境茁壯'
      },
      {
        coffeeName: 'SL28 Arabica',
        coffeeNameZh: 'SL28阿拉比卡',
        imageUrl: 'https://images.unsplash.com/photo-1500912708295-4cf8b060f381?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'SL28',
        suitabilityScore: 90,
        reason: 'Premium variety with exceptional cup quality at high altitude',
        reasonZh: '高海拔杯測品質卓越的優質品種'
      },
      {
        coffeeName: 'SL34 Arabica',
        coffeeNameZh: 'SL34阿拉比卡',
        imageUrl: 'https://plus.unsplash.com/premium_photo-1670758291967-25ed2e90f21e?q=80&w=3687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'SL34',
        suitabilityScore: 88,
        reason: 'Similar to SL28 but better disease resistance at high altitude',
        reasonZh: '與SL28相似但高海拔抗病性更好'
      },
      {
        coffeeName: 'Pacamara Coffee',
        coffeeNameZh: '帕卡馬拉咖啡',
        imageUrl: 'https://images.unsplash.com/photo-1586095516671-d085ff58cdd4?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'Pacamara',
        suitabilityScore: 85,
        reason: 'Large-bean specialty variety suited to Taiwan\'s high mountain climate',
        reasonZh: '適合台灣高山氣候的大粒精品品種'
      }
    ]
  },

  // ── ALPINE: 1800m+ ────────────────────────────────────────
  alpine: {
    range: { min: 1800, max: 4000 },
    label: 'Alpine Zone',
    labelZh: '高山帶',
    description: 'Extreme conditions — only the most cold-hardy crops thrive above 1800m',
    descriptionZh: '極端環境——僅耐寒作物能在1800公尺以上生存',

    crops: [
      {
        cropName: 'Tea (High Mountain Oolong)',
        cropNameZh: '極高山烏龍茶',
        imageUrl: 'https://images.unsplash.com/photo-1743401404293-0734bb7b5a42?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 96,
        reason: 'Ultra-premium tea above 1800m — extremely slow growth, world-class flavour',
        reasonZh: '1800公尺以上超頂級茶——生長極慢，風味世界一流'
      },
      {
        cropName: 'Apple (Fuji)',
        cropNameZh: '富士蘋果',
        imageUrl: 'https://images.unsplash.com/photo-1600917016506-556622b74303?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 94,
        reason: 'Alpine cold produces the most intensely flavoured Fuji apples in Taiwan',
        reasonZh: '高山嚴寒孕育台灣風味最濃郁的富士蘋果'
      },
      {
        cropName: 'Peach',
        cropNameZh: '水蜜桃',
        imageUrl: 'https://images.unsplash.com/photo-1590123471813-366f7ac75045?q=80&w=1288&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 92,
        reason: 'Wuling-style peaches at alpine altitude command the highest market prices',
        reasonZh: '高山帶的武陵式水蜜桃可獲得最高市場價格'
      },
      {
        cropName: 'Alpine Radish',
        cropNameZh: '高山蘿蔔',
        imageUrl: 'https://images.unsplash.com/photo-1587482990975-c1ca5fc6b268?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        suitabilityScore: 88,
        reason: 'Cold-hardy root vegetable that sweetens with altitude and frost',
        reasonZh: '耐寒根莖蔬菜，高海拔霜凍使其更甜'
      },
      {
        cropName: 'Chrysanthemum',
        cropNameZh: '菊花',
        imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=2070&auto=format&fit=crop',
        suitabilityScore: 86,
        reason: 'Cool-loving flower crop with strong tea and herbal market demand',
        reasonZh: '喜涼花卉作物，茶飲和草藥市場需求強勁'
      },
      {
        cropName: 'Alpine Garlic',
        cropNameZh: '高山大蒜',
        imageUrl: 'https://images.unsplash.com/photo-1501420311459-a17a4a9ca100?q=80&w=2070&auto=format&fit=crop',
        suitabilityScore: 85,
        reason: 'Strong flavour at altitude, high market value in Taiwan',
        reasonZh: '高海拔風味濃郁，台灣市場價值高'
      }
    ],

    coffees: [
      {
        coffeeName: 'Geisha Coffee',
        coffeeNameZh: '藝妓咖啡',
        imageUrl: 'https://images.unsplash.com/photo-1755601920093-5749b15ce893?q=80&w=2274&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'Geisha',
        suitabilityScore: 94,
        reason: 'At 1800m+ Geisha produces extraordinary floral complexity',
        reasonZh: '1800公尺以上的藝妓呈現卓越的花香複雜度'
      },
      {
        coffeeName: 'Ethiopian Heirloom Arabica',
        coffeeNameZh: '衣索比亞原生種阿拉比卡',
        imageUrl: 'https://images.unsplash.com/photo-1596253420645-f342693480aa?q=80&w=2002&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'Heirloom',
        suitabilityScore: 88,
        reason: 'Wild-type genetics handle alpine cold and altitude stress well',
        reasonZh: '野生型基因能良好應對高山寒冷和海拔壓力'
      },
      {
        coffeeName: 'Wush Wush Coffee',
        coffeeNameZh: '烏什烏什咖啡',
        imageUrl: 'https://images.unsplash.com/photo-1586095516671-d085ff58cdd4?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        variety: 'Wush Wush',
        suitabilityScore: 84,
        reason: 'Rare Ethiopian variety thriving at ultra-high elevations',
        reasonZh: '罕見的衣索比亞品種，適應超高海拔'
      }
    ]
  }
};

// ── HELPER: get zone key from elevation ──────────────────────
function getZoneFromElevation(elevationMeters) {
  if (elevationMeters < 800)  return 'lowland';
  if (elevationMeters < 1200) return 'mid';
  if (elevationMeters < 1800) return 'high';
  return 'alpine';
}

// ── MAIN EXPORT: getRecommendations ─────────────────────────
/**
 * Returns top crop and coffee recommendations for a given elevation
 *
 * @param {number} elevationMeters - farm elevation in metres
 * @param {number} maxCrops        - max crops to return (default 8)
 * @param {number} maxCoffees      - max coffees to return (default 5)
 * @returns {object} { zone, zoneData, crops, coffees, elevation }
 */
function getRecommendations(elevationMeters, maxCrops = 8, maxCoffees = 5) {
  const zone     = getZoneFromElevation(elevationMeters);
  const zoneData = ALTITUDE_ZONES[zone];

  const crops = [...zoneData.crops]
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    .slice(0, maxCrops);

  const coffees = [...zoneData.coffees]
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    .slice(0, maxCoffees);

  return {
    zone,
    zoneData: {
      label:         zoneData.label,
      labelZh:       zoneData.labelZh,
      description:   zoneData.description,
      descriptionZh: zoneData.descriptionZh,
      range:         zoneData.range
    },
    crops,
    coffees,
    elevation: elevationMeters
  };
}

module.exports = {
  ALTITUDE_ZONES,
  getZoneFromElevation,
  getRecommendations
};