// models/UpcomingContent.js

const mongoose = require('mongoose');

const upcomingContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' }, // Must be 'upcoming'
  duration: String,
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
  releaseDate: Date,
  bannerUrl: String, // This is specific to upcoming
  cast: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cast' }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  trailerUrl: String, // ⬅️ New field for trailer (can be a URL or uploaded video path)

  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }
}, {
  timestamps: true
});

module.exports = mongoose.model('UpcomingContent', upcomingContentSchema);
