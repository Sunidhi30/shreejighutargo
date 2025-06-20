// models/AdSchedule.js
const mongoose = require('mongoose');
const adScheduleSchema = new mongoose.Schema({
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
  scheduleType: {
    type: String,
    enum: ['time-based', 'interval-based'],
    required: true
  },
  // For time-based ads
  timePositions: [{ 
    timestamp: Number,  // in seconds
    displayed: { type: Boolean, default: false }
  }],
  // For interval-based ads
  intervalConfig: {
    startAfter: Number,  // seconds before first ad
    repeatEvery: Number, // seconds between ads
    maxOccurrences: Number // maximum number of times to show ad
  },
  isActive: { type: Boolean, default: true },
  performance: {
    totalDisplays: { type: Number, default: 0 },
    successfulDisplays: { type: Number, default: 0 },
    failedDisplays: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdSchedule', adScheduleSchema);
