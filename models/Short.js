// const mongoose = require('mongoose');

// const shortSchema = new mongoose.Schema({
//   vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
//   category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
//   language_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
//   name: { type: String, required: true },
//   description: { type: String },
//   thumbnail: { type: String },
//   video_url: { type: String, required: true }, // Single short video URL
//   video_extension: { type: String },
//   video_duration: { type: Number }, // In seconds, usually short (e.g., <60)

//   is_like: { type: Boolean, default: true },
//   likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//   is_comment: { type: Boolean, default: true },
//   comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
//   total_like: { type: Number, default: 0 },
//   total_view: { type: Number, default: 0 },
//   total_comment: { type: Number, default: 0 },
//   ratings: [
//     {
//       user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//       value: { type: Number, min: 1, max: 5 },
//     }
//   ],
//   averageRating: { type: Number, default: 0 },
//   ratingCount: { type: Number, default: 0 },
//   isApproved: { type: Boolean, default: false },
//   status: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected'],
//     default: 'pending'
//   },
//   approvalNote: String,
//   approvalDate: Date,
//   approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
// }, {
//   collection: 'tbl_shorts',
//   timestamps: true
// });

// module.exports = mongoose.model('Short', shortSchema);
const mongoose = require('mongoose');

const shortsSchema = new mongoose.Schema({
  // Basic Information
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Video Details
  video_url: { 
    type: String, 
    required: true 
  }, // Cloudinary URL
  thumbnail_url: { 
    type: String, 
    required: true 
  }, // Cloudinary thumbnail URL
  video_duration: { 
    type: Number, 
    required: true,
    max: 60 // Shorts are typically under 60 seconds
  },
  video_format: { 
    type: String, 
    default: 'mp4' 
  },
  video_quality: { 
    type: String, 
    enum: ['480p', '720p', '1080p'],
    default: '720p'
  },
  
  // References
  vendor_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vendor', 
    required: true 
  },
  channel_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Channel'
  },
  category_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category'
  },
  language_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Language'
  },
  
  // Tags and Hashtags
  tags: [{ 
    type: String,
    trim: true 
  }],
  hashtags: [{ 
    type: String,
    trim: true 
  }],
  
  // Engagement
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  total_likes: { 
    type: Number, 
    default: 0 
  },
  total_views: { 
    type: Number, 
    default: 0 
  },
  total_shares: { 
    type: Number, 
    default: 0 
  },
  total_comments: { 
    type: Number, 
    default: 0 
  },
  comments: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment' 
  }],
  
  // Settings
  is_comment_enabled: { 
    type: Boolean, 
    default: true 
  },
  is_download_enabled: { 
    type: Boolean, 
    default: false 
  },
  is_share_enabled: { 
    type: Boolean, 
    default: true 
  },
  
  // Content Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  isApproved: { 
    type: Boolean, 
    default: false 
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin' 
  },
  approvalDate: { 
    type: Date 
  },
  approvalNote: { 
    type: String 
  },
  rejectionReason: { 
    type: String 
  },
  
  // Monetization (if applicable)
  is_premium: { 
    type: Boolean, 
    default: false 
  },
  is_monetized: { 
    type: Boolean, 
    default: false 
  },
  ad_enabled: { 
    type: Boolean, 
    default: false 
  },
  
  // Analytics
  watch_time_total: { 
    type: Number, 
    default: 0 
  },
  completion_rate: { 
    type: Number, 
    default: 0 
  },
  
  // Visibility
  is_public: { 
    type: Boolean, 
    default: true 
  },
  is_featured: { 
    type: Boolean, 
    default: false 
  },
  is_trending: { 
    type: Boolean, 
    default: false 
  },
  
  // Upload Information
  upload_source: { 
    type: String, 
    enum: ['mobile', 'web', 'api'],
    default: 'web'
  },
  original_filename: { 
    type: String 
  },
  file_size: { 
    type: Number 
  }, // in bytes
  
  // Cloudinary specific
  cloudinary_public_id: { 
    type: String, 
    required: true 
  },
  cloudinary_version: { 
    type: String 
  },
  cloudinary_signature: { 
    type: String 
  }
}, {
  collection: 'tbl_shorts',
  timestamps: true
});

// Indexes for better performance
shortsSchema.index({ vendor_id: 1 });
shortsSchema.index({ status: 1 });
shortsSchema.index({ is_trending: 1 });
shortsSchema.index({ is_featured: 1 });
shortsSchema.index({ createdAt: -1 });
shortsSchema.index({ total_views: -1 });
shortsSchema.index({ total_likes: -1 });

// Pre-save middleware to update total counts
shortsSchema.pre('save', function(next) {
  if (this.likes) {
    this.total_likes = this.likes.length;
  }
  if (this.comments) {
    this.total_comments = this.comments.length;
  }
  next();
});

module.exports = mongoose.model('Shorts', shortsSchema);