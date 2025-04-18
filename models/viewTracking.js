const mongoose = require('mongoose');

const viewTrackingSchema = new mongoose.Schema({
  video_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Video', 
    required: true 
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  watchPercentage: { 
    type: Number, 
    default: 0 
  },
  isViewCounted: { 
    type: Boolean, 
    default: false 
  },
  watchedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model('ViewTracking', viewTrackingSchema);