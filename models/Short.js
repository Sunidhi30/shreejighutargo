const mongoose = require('mongoose');

const shortSchema = new mongoose.Schema({
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  language_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
  name: { type: String, required: true },
  description: { type: String },
  thumbnail: { type: String },
  video_url: { type: String, required: true }, // Single short video URL
  video_extension: { type: String },
  video_duration: { type: Number }, // In seconds, usually short (e.g., <60)

  is_like: { type: Boolean, default: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  is_comment: { type: Boolean, default: true },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  total_like: { type: Number, default: 0 },
  total_view: { type: Number, default: 0 },
  total_comment: { type: Number, default: 0 },
  ratings: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      value: { type: Number, min: 1, max: 5 },
    }
  ],
  averageRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvalNote: String,
  approvalDate: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, {
  collection: 'tbl_shorts',
  timestamps: true
});

module.exports = mongoose.model('Short', shortSchema);

