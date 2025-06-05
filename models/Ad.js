const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  video_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Video', 
    required: true 
  },
  adConfig: {
    enabled: { type: Boolean, default: true },
    adInterval: { type: Number, default: 300 }, // seconds between ads
    preRollAd: { type: Boolean, default: true },
    midRollAd: { type: Boolean, default: true },
    postRollAd: { type: Boolean, default: true },
    skipAfter: { type: Number, default: 5 },
    adBreakPositions: [{ type: Number }]
  },
  
  // ===== AD PROVIDERS CONFIGURATION =====
  adProviders: {
    google: {
      enabled: { type: Boolean, default: false },
      publisherId: { type: String }, // Google AdSense Publisher ID
      adUnitId: { type: String }, // Google Ad Unit ID
      adFormat: { type: String, enum: ['video', 'banner', 'interstitial'], default: 'video' },
      adSize: { type: String, default: '728x90' }, // Banner size
      testMode: { type: Boolean, default: true }
    },
    facebook: {
      enabled: { type: Boolean, default: false },
      placementId: { type: String }, // Facebook Placement ID
      adFormat: { type: String, enum: ['video', 'banner'], default: 'video' }
    },
    custom: {
      enabled: { type: Boolean, default: false },
      adContent: [{
        adId: { type: String },
        adUrl: { type: String },
        adDuration: { type: Number },
        adType: { type: String, enum: ['video', 'banner', 'overlay'], default: 'video' },
        clickUrl: { type: String },
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 }
      }]
    }
  },
  
  totalAdViews: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  collection: 'tbl_ads',
  timestamps: true
});

// Calculate ad break positions
adSchema.methods.calculateAdBreaks = function(videoDuration) {
  const positions = [];
  
  if (this.adConfig.preRollAd) {
    positions.push(0);
  }
  
  if (this.adConfig.midRollAd && videoDuration > this.adConfig.adInterval) {
    let currentPosition = this.adConfig.adInterval;
    while (currentPosition < videoDuration - 30) {
      positions.push(currentPosition);
      currentPosition += this.adConfig.adInterval;
    }
  }
  
  if (this.adConfig.postRollAd) {
    positions.push(videoDuration);
  }
  
  this.adConfig.adBreakPositions = positions;
  return positions;
};

module.exports = mongoose.model('Ad', adSchema);