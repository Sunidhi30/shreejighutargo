// models/PlatformStats.js
const mongoose = require('mongoose');

const platformStatsSchema = new mongoose.Schema({
  totalViews: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  totalVideos: { type: Number, default: 0 },
  // ... any other global stats
}, { timestamps: true });

module.exports = mongoose.model('PlatformStats', platformStatsSchema);
