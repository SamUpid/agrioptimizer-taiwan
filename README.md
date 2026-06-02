<div align="center">

<img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-4.x-000000?style=flat&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat&logo=bootstrap&logoColor=white" />
<img src="https://img.shields.io/badge/License-MIT-green?style=flat" />

# 🌿 AgroOptimizer Taiwan | 農業優化

### Smart Farming Platform for Taiwan's Mountain Farmers
**為台灣山地農民打造的智慧農業平台**

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Now-2D6A4F?style=for-the-badge)](https://agrioptimizer-taiwan.onrender.com)

<br/>

![AgroOptimizer Taiwan Home Page](https://images.unsplash.com/photo-1743401404293-0734bb7b5a42?q=80&w=2070&auto=format&fit=crop)

*High-mountain oolong tea farms in Alishan, Taiwan — the heart of our target users*

</div>

---

## 📖 About the Project

**AgroOptimizer Taiwan** is a full-stack agricultural decision support platform built specifically for mountain farmers in Taiwan's Alishan, Nantou, and surrounding highland regions.

Farmers pin their farm on a map, and the system automatically fetches their **exact elevation**. Based on altitude, it recommends the most suitable **crops** (up to 8) and **coffee varieties** (up to 5) for their specific mountain zone. Users get personalised dashboards, market economics, and AI-powered advice — all in English and 繁體中文.

---

## ✨ Features

### 🗺️ Smart Location System
- Google Maps integration — click to pin or enter GPS coordinates
- Automatic elevation fetch via Google Elevation API
- Taiwan-boundary validation (only Taiwan coordinates accepted)
- Single farm location per profile (Phase 1 design)

### 🌱 Altitude-Based Crop Recommendations
- **4 altitude zones** with distinct crop profiles:
  - 🌄 Lowland (200–800m) — Dragon Fruit, Papaya, Pineapple, Strawberry
  - ⛰️ Mid-Altitude (800–1200m) — Oolong Tea, Bamboo Shoots, Shiitake
  - 🏔️ High Mountain (1200–1800m) — High-Mountain Oolong, Apple, Peach
  - ❄️ Alpine (1800m+) — Premium Oolong, Alpine varieties
- 41 crops in database with market prices, yield data, break-even analysis
- Save up to **8 crops** per farm profile — enforced at schema + UI level

### ☕ Coffee Variety Recommendations
- 8 specialty coffee varieties matched to elevation zones
- Includes Geisha, Bourbon, SL28, Typica, Catuai, Caturra, SL34, Pacamara
- Cup quality scores, disease resistance, processing methods
- Save up to **5 coffee varieties** per farm profile

### 🏡 Personalised Farm Dashboard
- Editable farm name (inline edit)
- Live location display with change-location flow
- Saved crops and coffees with one-click remove
- 7-day weather forecast
- AI daily brief (skeleton loader → live text)
- Slot counters (X/8 crops, X/5 coffees)

### 🌐 Bilingual Support
- Full English + 繁體中文 on every page
- i18n with locale switching (EN / 中文)
- Hakka language foundation in place

### 👤 Guest + Auth Flow
- **Guest path**: Location → Recommendations → Economics (no save)
- **Auth path**: Full profile, saved selections, personalised dashboard
- Non-blocking "Sign up free" banner for guests after recommendations

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.x |
| Database | MongoDB + Mongoose |
| Templating | EJS + express-ejs-layouts |
| Frontend | Bootstrap 5.3 + custom CSS |
| Maps | Google Maps JavaScript API |
| Elevation | Google Elevation API |
| Auth | express-session + bcryptjs |
| i18n | node-i18n |
| AI | Claude API (advisor) / Gemini API (Cline) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Maps API key (with Elevation API enabled)

### Installation

```bash
# Clone the repo
git clone https://github.com/SamUpid/agrioptimizer-taiwan.git
cd agrioptimizer-taiwan

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Fill in your values (see Environment Variables below)

# Seed the database
node init/seedCrops.js
node init/seedCoffee.js

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root with:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/agrioptimizer

# Session
SESSION_SECRET=your-secret-key-here

# Google APIs
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# AI (optional)
ANTHROPIC_API_KEY=your-claude-api-key
```

---

## 📁 Project Structure

```
agrioptimizer-taiwan/
├── controllers/          # Route handlers
│   ├── cropsController.js
│   ├── coffeeController.js
│   ├── locationController.js
│   └── economicsController.js
├── data/
│   └── altitudeLookup.js # Altitude zone → crop/coffee mapping
├── init/                 # Database seeders
│   ├── seedCrops.js      # 41 crops
│   └── seedCoffee.js     # 8 coffee varieties
├── models/
│   ├── User.js
│   ├── FarmProfile.js    # crops[], coffees[], location
│   ├── Crop.js
│   └── CoffeeVariety.js
├── public/
│   ├── css/
│   │   ├── home-page.css
│   │   └── dashboard-page.css
│   └── js/
│       └── farm-actions.js  # Save/remove crops & coffees
├── routes/
│   ├── dashboard.js
│   ├── cropsPages.js
│   ├── coffeePages.js
│   └── auth.js
├── views/
│   ├── home.ejs
│   ├── dashboard.ejs
│   ├── crops.ejs
│   ├── coffee.ejs
│   └── layout.ejs
└── app.js
```

---

## 🗺️ Altitude Zone System

The core of the recommendation engine is `data/altitudeLookup.js`:

```
200–800m   → Lowland Hills 低山丘陵
800–1200m  → Mid-Altitude  中海拔
1200–1800m → High Mountain 高山
1800m+     → Alpine Zone   高山帶
```

Each zone maps to crops and coffee varieties with:
- Suitability score (0–100)
- Reason text (EN + 中文)
- Unsplash image URL (manually curated)
- DB enrichment (market price, yield, break-even)

---

## 🌱 Crop & Coffee Data

| Category | Count |
|----------|-------|
| Fruits | 14 |
| Vegetables | 10 |
| Specialty (Tea, Coffee) | 7 |
| Herbs | 6 |
| Grains | 2 |
| Mushrooms | 2 |
| **Total Crops** | **41** |
| **Coffee Varieties** | **8** |

---

## 🗺️ Roadmap

- [x] Location page with Google Maps + elevation
- [x] Altitude-based crop recommendations (41 crops)
- [x] Coffee variety recommendations (8 varieties)
- [x] Personalised farm dashboard
- [x] Save/remove crops and coffees
- [x] Bilingual EN / 繁體中文
- [x] Guest + auth flow
- [ ] Economics page — market prices + profit estimates
- [ ] Claude AI crop advisor chat
- [ ] Taiwan CWA weather API integration
- [ ] Light theme for all pages
- [ ] Push notifications (frost alerts, harvest windows)

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you would like to change.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ☕ and 🍵 for Taiwan's mountain farmers

**阿里山 · 南投 · 台灣**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Now-2D6A4F?style=for-the-badge)](https://agrioptimizer-taiwan.onrender.com)

</div>
