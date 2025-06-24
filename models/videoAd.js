const mongoose = require('mongoose');

const videoAdSchema = new mongoose.Schema({
  video_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  ad_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
    required: true
  },
  placement_type: {
    type: String,
    enum: ['pre-roll', 'mid-roll', 'post-roll', 'banner-overlay'],
    required: true
  },
  position: {
    type: Number, // For mid-roll ads - timestamp in seconds
    default: 0
  },
  duration: {
    type: Number, // How long the ad should play (in seconds)
    default: 15
  },
  skip_after: {
    type: Number, // Allow skip after X seconds (0 = no skip)
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number, // Higher number = higher priority
    default: 1
  },
  frequency: {
    type: Number, // Show ad every X views (1 = every view)
    default: 1
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  start_date: {
    type: Date,
    default: Date.now
  },
  end_date: {
    type: Date
  },
  views_count: {
    type: Number,
    default: 0
  },
  clicks_count: {
    type: Number,
    default: 0
  }
}, {
  collection: 'tbl_video_ads',
  timestamps: true
});

// Compound index for efficient queries
videoAdSchema.index({ video_id: 1, placement_type: 1, is_active: 1 });

module.exports = mongoose.model('VideoAd', videoAdSchema);