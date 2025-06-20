// models/Ad.js
const mongoose = require('mongoose');
const adSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['banner', 'interstitial', 'rewarded', 'native'],
    required: true 
  },
  platform: { 
    type: String,
    enum: ['admob', 'facebook', 'custom'],
    default: 'admob'
  },
  adUnitId: { type: String, required: true },  
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  frequency: { type: Number, default: 1 }, 
  displayTimes: [{ type: Number }], 
  priority: { type: Number, default: 1 },
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Ad', adSchema);
