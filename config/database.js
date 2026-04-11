/**
 * MongoDB Database Configuration
 * Handles connection to MongoDB Atlas with error handling and reconnection logic
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Exit process with failure
    process.exit(1);
  }
};

/**
 * Gracefully close database connection
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};