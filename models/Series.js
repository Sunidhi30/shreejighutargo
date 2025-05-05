// models/Series.js
const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  thumbnail: { type: String },
  landscape: { type: String },
  releaseYear: { type: Number },
  totalSeasons: { type: Number, default: 1 },
  status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing' },
  isApproved: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Series', seriesSchema);
