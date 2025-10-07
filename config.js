// config.js
require('dotenv').config(); // Load .env at the very start of this module

module.exports = {
  SESSION_SECRET: process.env.SESSION_SECRET,
  PORT: process.env.PORT || 3000
  // Add other environment variables here as needed
};