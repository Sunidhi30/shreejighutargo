const mongoose = require('mongoose');
const adSchema = new mongoose.Schema({
  ad_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  ad_name: {
    type: String,
    required: true,
    trim: true
  },
  ad_type: {
    type: String,
    enum: ['banner', 'video', 'interstitial', 'rewarded'],
    default: 'banner'
  },
  ad_provider: {
    type: String,
    enum: ['admob', 'facebook', 'unity', 'custom'],
    default: 'admob' 
  },
  ad_url: {
    type: String,
    trim: true
  },
  ad_image: {
    type: String, // For banner ads
    trim: true
  },
  ad_video: {
    type: String, // For video ads
    trim: true
  },
  duration: {
    type: Number, // Duration in seconds for video ads
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  click_count: {
    type: Number,
    default: 0
  },
  impression_count: {
    type: Number,
    default: 0
  }
}, {
  collection: 'tbl_ads',
  timestamps: true
});
module.exports = mongoose.model('Ad', adSchema);