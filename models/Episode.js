// // models/Episode.js
// const mongoose = require('mongoose');
// const episodeSchema = new mongoose.Schema({
//     series_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
//     season_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
//     video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
//     episodeNumber: { type: Number, required: true },
//     title: { type: String, required: true },
//     description: { type: String },
//     duration: { type: Number },
//     thumbnail: { type: String },
//     isApproved: { type: Boolean, default: false }
//   }, {
//     timestamps: true
//   });
  
//   module.exports = mongoose.model('Episode', episodeSchema);
 
const mongoose = require('mongoose');
const episodeSchema = new mongoose.Schema({
  // Series Related Fields
  series_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
  season_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
  episode_number: { type: Number, required: true },
  season_number: { type: Number, required: true },
  // Basic Fields (from Video Schema)
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
  video_type: { type: String },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  channel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  producer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Producer' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  language_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
  cast_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cast' },
  name: { type: String, required: true },
  thumbnail: { type: String },
  landscape: { type: String },
  description: { type: String },
  // Video Related Fields
  video_upload_type: { type: String },
  video_320: { type: String },
  video_480: { type: String },
  video_720: { type: String },
  video_1080: { type: String },
  video_extension: { type: String },
  video_duration: { type: Number },
  trailer: {
    url: { type: String },
    type: {
      type: String,
      enum: ['upload', 'external'],
      default: 'external'
    }
  },
  
  // Trailer Related Fields
  // trailer_type: { type: String },
  // trailer_url: { type: String },

  // Subtitle Related Fields
  subtitle_type: { type: String },
  subtitle_lang_1: { type: String },
  subtitle_1: { type: String },
  subtitle_lang_2: { type: String },
  subtitle_2: { type: String },
  subtitle_lang_3: { type: String },
  subtitle_3: { type: String },

  // Additional Fields
  release_date: { type: String },
  is_premium: { type: Number, default: 0 },
  is_title: { type: Number, default: 0 },
  is_download: { type: Number, default: 0 },
  is_like: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  is_comment: { type: Number, default: 0 },
  total_like: { type: Number, default: 0 },
  total_view: { type: Number, default: 0 },
  finalPackage_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FinalPackage' },
  // Monetization Fields
  price: { type: Number, default: null },
  rentDuration: { type: Number, default: null },
  viewCount: { type: Number, default: 0 },
  adViews: { type: Number, default: 0 },
  is_rent: { type: Number, default: 0 },
  rent_day: { type: Number, default: 0 },
  // Status Fields
  isApproved: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  // Package Related Fields
  package_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  packageType: { type: String, enum: ['rental', 'view', 'ad'] },
  totalEarnings: { type: Number, default: 0 },

  // Approval Related Fields
  approvalNote: String,
  approvalDate: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },

  // Rating Related Fields
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    value: { type: Number, min: 1, max: 5 }
  }],
  averageRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }
}, {
  collection: 'tbl_episodes',
  timestamps: true
});

// Add indexes for better query performance
episodeSchema.index({ series_id: 1, season_id: 1, episode_number: 1 }, { unique: true });
episodeSchema.index({ vendor_id: 1 });
episodeSchema.index({ status: 1 });

module.exports = mongoose.model('Episode', episodeSchema);
