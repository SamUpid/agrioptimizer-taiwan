/**
 * AgriOptimizer Taiwan - Main Application
 * Agricultural decision support system for Taiwanese farmers
 */

// Load environment variables first
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const i18n = require('i18n');
const { connectDB } = require('./config/database');
const FarmProfile = require('./models/FarmProfile');
const authRoutes = require("./routes/auth");

// Initialize Express app
const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// ============================================================
// DATABASE CONNECTION
// ============================================================
connectDB();

// ============================================================
// i18n CONFIGURATION (Internationalization)
// ============================================================
i18n.configure({
  locales: ['en', 'zh-TW'],
  defaultLocale: 'en',
  directory: path.join(__dirname, 'locales'),
  objectNotation: true,
  updateFiles: false,
  syncFiles: false,
  cookie: 'language'
});

// ============================================================
// VIEW ENGINE SETUP
// ============================================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Layout support
app.use(expressLayouts);   // Must be after view engine setup
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// ============================================================
// MIDDLEWARE
// ============================================================

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware (must be before session)
app.use(cookieParser());

// Method override for PUT/DELETE requests from forms
app.use(methodOverride('_method'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration (ONLY ONE - removed duplicate!)
app.use(session({
  secret: process.env.SESSION_SECRET || 'agrioptimizer-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // Lazy session update (seconds)
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // HTTPS only in production
  }
}));

// Flash middleware
app.use(flash());

// i18n middleware
app.use(i18n.init);

// Language middleware — always sets locale
app.use((req, res, next) => {
  const lang = req.query.lang || req.cookies.language || 'en';
  
  if (['en', 'zh-TW'].includes(lang)) {
    req.setLocale(lang);
  }
  
  res.locals.locale = req.getLocale() || 'en';
  res.locals.__ = res.__ || function(t) { return t; };
  next();
});

// Make session data and flash messages available to all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.user = req.session.user || null;
  res.locals.page = ''; // Default empty, will be overridden by each route
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.info_msg = req.flash('info');
  next();
});

// ============================================================
// ROUTES
// ============================================================

// Home route
app.get('/', async (req, res) => {
  // Allow ?preview=true to bypass dashboard redirect
  // so developers and logged-in users can still see homepage
  const preview = req.query.preview === 'true';
  
  try {
    if (req.session.user && !preview) {
      const farmProfile = await FarmProfile.findOne({ 
        userId: req.session.user._id 
      });
      if (farmProfile) {
        return res.redirect('/dashboard');
      }
    }
  } catch (error) {
    console.error('Home route FarmProfile lookup error:', error);
  }

  res.render('home', {
    title: 'AgriOptimizer Taiwan',
    page: 'home'
  });
});

// Language switcher route
app.get('/language/:lang', (req, res) => {
  const { lang } = req.params;
  if (['en', 'zh-TW'].includes(lang)) {
    req.setLocale(lang);
    res.cookie('language', lang, { maxAge: 900000, httpOnly: true });
  }
  // Redirect back to previous page or home
  const redirectUrl = req.get('Referer') || '/';
  res.redirect(redirectUrl);
});

// API Routes (for testing and data access)
app.use('/api/crops', require('./routes/crops'));
app.use('/api/coffee', require('./routes/coffee'));
app.use('/api/companions', require('./routes/companions'));
app.use('/api/ai', require('./routes/ai'));

// Authentication routes
app.use('/auth', authRoutes);

// Frontend routes
app.use('/location', require('./routes/location'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/climate', require('./routes/climate'));
app.use('/crops', require('./routes/cropsPages'));
app.use('/coffee', require('./routes/coffeePages'));
app.use('/economics', require('./routes/economicsPages'));
app.use('/advisor', require('./routes/advisorPages'));

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    page: 'error',
    message: 'The page you are looking for does not exist.',
    error: { status: 404 }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;
  
  res.status(status).render('error', {
    title: `${status} - Error`,
    page: 'error',
    message: message,
    error: process.env.NODE_ENV === 'development' ? err : { status }
  });
});

// ============================================================
// SERVER START
// ============================================================
app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('🌱 AgriOptimizer Taiwan Server Started');
  console.log('========================================');
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log('========================================');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  app.close(() => {
    console.log('✅ Process terminated');
  });
});

module.exports = app;