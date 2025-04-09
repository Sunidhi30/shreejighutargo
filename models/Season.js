// models/Season.js
const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  content: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  seasonNumber: Number,
  episodes: [{
    title: String,
    description: String,
    videoUrl: String,
    duration: String
  }]
});

module.exports = mongoose.model('Season', seasonSchema);
