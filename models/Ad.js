// const mongoose = require('mongoose');
// const adSchema = new mongoose.Schema({
//   ad_id: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },
//   ad_name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   ad_type: {
//     type: String,
//     enum: ['banner', 'video', 'interstitial', 'rewarded'],
//     default: 'banner'
//   },
//   ad_provider: {
//     type: String,
//     enum: ['admob', 'facebook', 'unity', 'custom'],
//     default: 'admob' 
//   },
//   ad_url: {
//     type: String,
//     trim: true
//   },
//   ad_image: {
//     type: String, // For banner ads
//     trim: true
//   },
//   ad_video: {
//     type: String, // For video ads
//     trim: true
//   },
//   duration: {
//     type: Number, // Duration in seconds for video ads
//     default: 0
//   },
//   is_active: {
//     type: Boolean,
//     default: true
//   },
//   created_by: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Admin',
//     required: true
//   },
//   click_count: {
//     type: Number,
//     default: 0
//   },
//   impression_count: {
//     type: Number,
//     default: 0
//   }
// }, {
//   collection: 'tbl_ads',
//   timestamps: true
// });
// module.exports = mongoose.model('Ad', adSchema);


// =============================================
// 1. AD MODEL (models/Ad.js)
// =============================================
const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  
  // Ad Type Configuration
  adType: {
    type: String,
    enum: ['banner', 'interstitial', 'reward'],
    required: true
  },
  
  // Platform-specific Ad IDs
  android: {
    enabled: { type: Boolean, default: false },
    adId: String,
    clickCount: { type: Number, default: 0 }
  },
  
  ios: {
    enabled: { type: Boolean, default: false },
    adId: String,
    clickCount: { type: Number, default: 0 }
  },
  
  // Ad Content (for custom ads)
  mediaUrl: String, // Image/Video URL for the ad
  clickUrl: String, // Redirect URL when ad is clicked
  duration: Number, // Duration in seconds (for video ads)
  
  // Targeting & Scheduling
  targetAudience: {
    ageRange: { min: Number, max: Number },
    gender: { type: String, enum: ['male', 'female', 'all'] },
    location: [String] // Array of countries/regions
  },
  
  schedule: {
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: true }
  },
  
  // Performance Metrics
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  
  // Ad Placement in Video
  placement: {
    type: String,
    enum: ['pre-roll', 'mid-roll', 'post-roll', 'overlay'],
    default: 'pre-roll'
  },
  
  // For mid-roll ads
  showAt: { type: Number, default: 0 }, // Timestamp in seconds
  
  // Vendor/Creator who owns this ad
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  
  // // Admin approval
  // isApproved: { type: Boolean, default: false },
  // approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  // approvalDate: Date,
  
}, {
  collection: 'tbl_ads',
  timestamps: true
});

module.exports = mongoose.model('Ad', adSchema);