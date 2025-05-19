const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  show_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TVShow',
    required: true
  },
  season_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TVSeason',
    required: true
  },
  episode_number: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,

  thumbnail: String,
  landscape: String,

  // Video Info
  video_upload_type: String,
  video_320: String,
  video_480: String,
  video_720: String,
  video_1080: String,
  video_extension: String,
  video_duration: Number,

  // Trailer
  trailer_type: String,
  trailer_url: String,

  // Subtitle (optional multi-language)
  subtitles: [{
    language: String,
    url: String
  }],

  // Cast and Crew (can be extended)
  cast_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cast' },
  producer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Producer' },
  language_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

  // Monetization
  is_premium: { type: Number, default: 0 },
  is_rent: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  rent_day: { type: Number, default: 0 },

  // Engagement
  is_like: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  total_like: { type: Number, default: 0 },
  is_comment: { type: Number, default: 0 },
  total_view: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  adViews: { type: Number, default: 0 },

  // Approval
  isApproved: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvalNote: String,
  approvalDate: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

  // Vendor
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },

  // Ratings
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    value: { type: Number, min: 1, max: 5 }
  }],
  averageRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },

  // Tags and Metadata
  tags: [String],
  release_date: String

}, {
  collection: 'tbl_episodes',
  timestamps: true
});

// Index for unique episode constraint
episodeSchema.index({ show_id: 1, season_id: 1, episode_number: 1 }, { unique: true });
episodeSchema.index({ vendor_id: 1 });
episodeSchema.index({ status: 1 });

module.exports = mongoose.model('TVEpisode', episodeSchema);
