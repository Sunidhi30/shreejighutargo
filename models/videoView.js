const mongoose = require('mongoose');

// Define the schema for video views
const videoViewSchema = new mongoose.Schema({
  video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  watchedPercentage: { type: Number, required: true },
  isCompleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Create a model using the schema
const VideoView = mongoose.model('VideoView', videoViewSchema);

module.exports = VideoView;
