const mongoose = require('mongoose');
const  Type  = require("../models/Type")
const videoSchema = new mongoose.Schema({
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
  video_type: {
    type: String,
    default: 'movie',
    immutable: true // Prevent updates
  },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  channel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }, // ✅ Updated
  producer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Producer' }, // ✅ Updated
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  language_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
  cast_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cast' }], // Changed from single cast_id to array of cast_ids
  name: { type: String },
  title: { type: String },
  thumbnail: { type: String },
  landscape: { type: String },
  description: { type: String },
  video_upload_type: { type: String },
  video_320: { type: String },
  video_480: { type: String },
  video_720: { type: String },
  video_1080: { type: String },
  video_extension: { type: String },
  video_duration: { type: Number },
  trailer_type: { type: String },
  trailer_url: { type: String },
  subtitle_type: { type: String },
  subtitle_lang_1: { type: String },
  subtitle_1: { type: String },
  subtitle_lang_2: { type: String },
  subtitle_2: { type: String },
  subtitle_lang_3: { type: String },
  subtitle_3: { type: String },
  release_date: { type: String },
  is_premium: { type: Number },
  is_title: { type: Number },
  is_download: { type: Number },
  is_like: { type: Number },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  is_comment: { type: Number },
  total_like: { type: Number },
  total_view: { type: Number },
  // finalPackage_id: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'FinalPackage', // Reference to the FinalPackage model
  //   required: false // If this is optional, ensure it allows null or undefined values
  // },
  finalPackage_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FinalPackage' },
  // monetizationType: { type: String, enum: ["rental", "ad", "view"], required: false },
  price: { type: Number, default: null }, // rent-based
  rentDuration: { type: Number, default: null }, // in days
  viewCount: { type: Number, default: 0 }, // view-based
  adViews: { type: Number, default: 0 }, // ad-based
  is_rent: { type: Number },
  price: { type: Number },
  rent_day: { type: Number },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  isApproved: { type: Boolean, default: false } , // 👈 Add this line
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  isTop10: { type: Boolean, default: false },
  package_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  packageType: { type: String, enum: ['rental', 'view', 'ad'] },
  totalEarnings: { type: Number, default: 0 }, // Total earnings from this video
  approvalNote: String, // Admin's note on approval/rejection
  approvalDate: Date,
  total_like: { type: Number, default: 0 }, // Track likes
// total_view: { type: Number, default: 0 }, // Track views
total_comment: { type: Number, default: 0 }, // Track comments
ratings: [
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    value: { type: Number, min: 1, max: 5 },
  }
],
averageRating: { type: Number, default: 0 },
ratingCount: { type: Number, default: 0 },


// Enhanced ad configuration
adConfiguration: {
  hasAds: { type: Boolean, default: false },
  adDensity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  skipAfter: { type: Number, default: 5 }, // Skip button appears after X seconds
  maxAdsPerSession: { type: Number, default: 3 }
},

// Ad breaks with more details
adBreaks: [{
  position: { type: Number }, // timestamp in seconds
  duration: { type: Number }, // duration in seconds
  type: { type: String, enum: ['pre-roll', 'mid-roll', 'post-roll', 'overlay'] },
  ad_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad' },
  isSkippable: { type: Boolean, default: true },
  skipAfter: { type: Number, default: 5 }
}],

// Updated ads array (already exists in your schema)
ads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ad' }],

// Ad performance for this video
adPerformance: {
  totalImpressions: { type: Number, default: 0 },
  totalClicks: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  lastAdServed: Date
},

isSeries: { type: Boolean, default: false },
series_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
season_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Season' },
episodeNumber: { type: Number },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, {
  collection: 'tbl_video',
  timestamps: true
});
// 🔁 Automatically assign "Movie" type if not manually set
videoSchema.pre('save', async function(next) {
  if (!this.type_id) {
    try {
      const movieType = await Type.findOne({ type: 1 }); // 1 corresponds to Movie
      if (movieType) {
        this.type_id = movieType._id;
      } else {
        console.warn("Movie type not found in 'tbl_type'.");
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});
module.exports = mongoose.model('Video', videoSchema);
