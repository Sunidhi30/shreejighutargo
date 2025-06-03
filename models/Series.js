// models/Series.js
const mongoose = require('mongoose');
const Type = require("../models/Type")
const seriesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type'},
  thumbnail: { type: String },
  landscape: { type: String },
  releaseYear: { type: Number },
  totalSeasons: { type: Number, default: 0 },
  status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing' },
  isApproved: { type: Boolean, default: false },
   approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: { type: String, default: '' }, // ✅ added field
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // ✅ NEW
  rating: { type: Number, default: 0 },
  tags: [String]
}, {
  timestamps: true
});
seriesSchema.pre('save', async function (next) {
  if (!this.type_id) {
    const webSeriesType = await mongoose.model('Type').findOne({ name: 'web-series' });
    if (webSeriesType) {
      this.type_id = webSeriesType._id;
    }
  }
  next();
});

module.exports = mongoose.model('Series', seriesSchema);
