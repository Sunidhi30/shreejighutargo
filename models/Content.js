// models/Content.js
const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' }, // Movie, Web Series, Short
  duration: String,
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
  releaseDate: Date,
  thumbnailUrl: String,
  videoUrl: String,
  cast: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cast' }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  isTop10: { type: Boolean, default: false },
  seasons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Season' }]
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
