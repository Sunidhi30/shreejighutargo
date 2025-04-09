const mongoose = require('mongoose');

const typeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['video', 'show', 'upcoming', 'channel', 'kids','webSeries','shortVideos'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Type', typeSchema);
