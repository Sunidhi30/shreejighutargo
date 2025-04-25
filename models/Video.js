const mongoose = require('mongoose');
const videoSchema = new mongoose.Schema({
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
  video_type: { type: String },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  channel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }, // ✅ Updated
  producer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Producer' }, // ✅ Updated
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  language_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
  cast_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cast' },
  name: { type: String },
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
  is_comment: { type: Number },
  total_like: { type: Number },
  total_view: { type: Number },
  monetizationType: { type: String, enum: ["rental", "ad", "view"], required: true },
  price: { type: Number, default: null }, // rent-based
  rentDuration: { type: Number, default: null }, // in days
  viewCount: { type: Number, default: 0 }, // view-based
  adViews: { type: Number, default: 0 }, // ad-based
  is_rent: { type: Number },
  price: { type: Number },
  rent_day: { type: Number },
  isApproved: { type: Boolean, default: false } , // 👈 Add this line
  status: { type: Number },
  package_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  packageType: { type: String, enum: ['rental', 'view', 'ad'] },
  totalEarnings: { type: Number, default: 0 }, // Total earnings from this video
  approvalNote: String, // Admin's note on approval/rejection
  approvalDate: Date,
  total_like: { type: Number, default: 0 }, // Track likes
total_view: { type: Number, default: 0 }, // Track views
total_comment: { type: Number, default: 0 }, // Track comments
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, {
  collection: 'tbl_video',
  timestamps: true
});
module.exports = mongoose.model('Video', videoSchema);
