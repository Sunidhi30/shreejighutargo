const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  title: { type: String, required: true },
  adUrl: { type: String, required: true }, // URL to the ad video
  position: { type: Number, required: true }, // timestamp in seconds
  duration: { type: Number, required: true }, // duration in seconds
  type: { 
    type: String, 
    enum: ['pre-roll', 'mid-roll', 'post-roll'], 
    required: true 
  },
  isActive: { type: Boolean, default: true },
  skipAfter: { type: Number, default: 5 }, // seconds after which ad can be skipped
  views: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Ad', adSchema);
