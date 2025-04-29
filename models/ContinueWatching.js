const mongoose = require('mongoose');

const continueWatchingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  progress: { type: Number, default: 0 }, // in seconds
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ContinueWatching', continueWatchingSchema);
