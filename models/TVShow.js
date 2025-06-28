
const mongoose = require('mongoose');
const Type = require("../models/Type")
const  tvShowSchema = new mongoose.Schema({
  title: { type: String, required: true },

  description: { type: String },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  channel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  language_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
  video_type: {
    type: String,
    default: 'show',
    immutable: true // Prevent updates
  },
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
  thumbnail: { type: String },
  landscape: { type: String },
  releaseYear: { type: Number },
  totalSeasons: { type: Number, default: 1 },
  status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing' },
  // Admin approval fields
  isApproved: { type: Boolean, default: false },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  total_like: { type: Number, default: 0 },
  approvalNotes: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  tags: [String]
}, {
  timestamps: true
});

tvShowSchema.pre('save', async function (next) {
  if (!this.type_id) {
    const webSeriesType = await mongoose.model('Type').findOne({ name: 'show' });
    if (webSeriesType) {
      this.type_id = webSeriesType._id;
    }
  }
  next();
});

module.exports = mongoose.model('tvShowSchema',  tvShowSchema);
