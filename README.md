# 🌱 AgriOptimizer Taiwan - Smart Farming Platform

<img width="1388" height="951" alt="Screenshot 2026-04-12 at 6 57 07 PM" src="https://github.com/user-attachments/assets/9d710a7a-eda2-4e1b-9b37-cb597082f60d" />


[![View Live Demo](https://img.shields.io/badge/🌐_View_Live_Demo-4CAF50?style=for-the-badge&logo=globe&logoColor=white&labelColor=2E7D32&fontSize=24px)](https://agrioptimizer-taiwan.onrender.com)

---

## 📋 Project Description

AgriOptimizer Taiwan is a data-driven agricultural platform built for Taiwan's mountain farmers. Users can pin their farm on an interactive Google Map, receive real-time climate analysis from Taiwan's Weather Bureau, and get personalized crop recommendations scored by suitability — all with **bilingual (EN/ZH) support**. The platform combines geospatial data, live weather APIs, and an economic ROI calculator to help farmers make smarter, more profitable decisions.

---

## ✨ Key Features

| Feature | Description |
| --- | --- |
| 📍 **Location Input** | Pin your farm on Google Maps with autocomplete, drag-to-adjust marker, and geolocation support |
| 🌤️ **Climate Analysis** | Live temperature & rainfall charts powered by Taiwan Weather Bureau (CWA) API |
| 🌾 **Crop Recommendations** | Suitability-scored rankings across 30+ Taiwan crops with bilingual names (EN/ZH) |
| ☕ **Coffee Module** | Specialized data for 5+ Taiwan coffee varieties including Arabica and Oolong |
| 💰 **Economics Calculator** | ROI projections, market price data, and break-even analysis per crop |
| 🗺️ **Google Maps Integration** | Elevation detection, Taiwan-restricted autocomplete, and coordinate display |
| 🌐 **Bilingual Support** | Full English / Chinese (Traditional) language toggle |
| 📱 **Responsive Design** | Optimized for desktop, tablet, and mobile |

---

## 🛠 Tech Stack

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com)
[![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)

- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Frontend:** EJS Templating, Bootstrap 5, Chart.js
- **APIs:** Google Maps (Geocoding + Elevation), Taiwan CWA Weather Bureau
- **Internationalization:** i18n middleware (EN / ZH-TW)
- **File Upload:** Multer + Cloudinary
- **Security:** Helmet, CORS, express-session
- **Deployment:** Render

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/SamUpid/agrioptimizer-taiwan.git

# Navigate to project directory
cd agrioptimizer-taiwan

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your MongoDB URI, Google Maps API key, and CWA API key

# Seed the crop database
node init/seedCrops.js
node init/seedCoffee.js

# Start the development server
npm start
```

**🌐 Access the app at:** `http://localhost:3000`

---

## 🔑 Environment Variables

Create a `.env` file in the root directory with the following:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
CWA_API_KEY=your_taiwan_weather_bureau_api_key
SESSION_SECRET=your_session_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_KEY=your_cloudinary_key
CLOUDINARY_SECRET=your_cloudinary_secret
PORT=3000
```

---

## 🌾 How It Works

1. **Select Location** — Pin your farm on the map or use your current GPS location
2. **Analyze Climate** — View monthly temperature and rainfall charts from live CWA data
3. **Browse Crops** — See all suitable crops ranked by suitability score (0–100)
4. **Check Economics** — Compare ROI%, market prices, and break-even timelines
5. **Coffee Module** — Explore specialized coffee varieties suited to your elevation

---

## 🗂 Project Structure

```
agrioptimizer-taiwan/
├── config/          # Database and API configuration
├── controllers/     # Route handler logic
├── init/            # Database seed scripts (crops + coffee)
├── locales/         # EN / ZH translation files
├── middleware/      # Auth and i18n middleware
├── models/          # Mongoose schemas (Crop, CoffeeVariety, Location)
├── public/          # Static assets (CSS, JS, images)
├── routes/          # Express route definitions
├── utils/           # API clients (Google Maps, CWA Weather)
├── views/           # EJS templates
├── app.js           # Express app entry point
└── .env.example     # Environment variable template
```

---

## 🔮 Future Enhancements

- Booking / consultation system for agricultural advisors
- Companion crop planting suggestions
- Crop comparison side-by-side view
- Admin dashboard for managing crop database
- AI-powered planting schedule recommendations
- Real-time market price integration
- Offline support for remote mountain areas

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, open an issue first to discuss your ideas.

---

**⭐ Star this repo if you find it helpful!**

Made with ❤️ using Node.js + Google Maps + Taiwan CWA Data
