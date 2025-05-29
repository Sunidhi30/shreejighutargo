// models/DynamicVideo.js
const mongoose = require('mongoose');

const dynamicVideoSchema = new mongoose.Schema({
  name: String,
  type: String, // e.g., "sports", "drama"
  description: String,
  video_320: String,
  video_1080: String,
  isApproved: { type: Boolean, default: false },
  extra: mongoose.Schema.Types.Mixed // for type-specific dynamic fields
});

module.exports = mongoose.model('DynamicVideo', dynamicVideoSchema);
