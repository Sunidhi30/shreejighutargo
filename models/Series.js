// // models/Series.js
// const mongoose = require('mongoose');
// const Type = require("../models/Type")
// const seriesSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String },
//   vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
//   category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
//   language_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
//   type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type'},
//   channel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }, // ✅ Updated

//   video_type: {
//     type: String,
//     default: 'series',
//     immutable: true // Prevent updates
//   },
//   thumbnail: { type: String },
//   landscape: { type: String },
//   releaseYear: { type: Number },
//   totalSeasons: { type: Number, default: 0 },
//   status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing' },
//   isApproved: { type: Boolean, default: false },
//    approvalStatus: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected'],
//     default: 'pending'
//   },
//   adminNotes: { type: String, default: '' }, // ✅ added field
//   approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // ✅ NEW
//   rating: { type: Number, default: 0 },
//   tags: [String]
// }, {
//   timestamps: true
// });
// seriesSchema.pre('save', async function (next) {
//   if (!this.type_id) {
//     const webSeriesType = await mongoose.model('Type').findOne({ name: 'web-series' });
//     if (webSeriesType) {
//       this.type_id = webSeriesType._id;
//     }
//   }
//   next();
// });

// module.exports = mongoose.model('Series', seriesSchema);


const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  language_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' }, // Will be set if not passed
  channel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },

  video_type: {
    type: String,
    default: 'series',
    immutable: true // ❗ Cannot be changed once set
  },

  trailer: {
    url: { type: String },
    type: { 
      type: String, 
      enum: ['upload', 'external'], // To distinguish between uploaded and external URLs
      default: 'external'
    }
  },
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
  adminNotes: { type: String, default: '' },
  total_like: { type: Number, default: 0 },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  rating: { type: Number, default: 0 },
  tags: [String]
}, {
  timestamps: true
});

// 🔄 Set default Type if not provided
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
