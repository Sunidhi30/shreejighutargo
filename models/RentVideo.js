const mongoose = require('mongoose');

// Import referenced models
const Type = require('./Type');
const Video = require('./Video');
const TVShow = require('./TVShow');

const rentVideoSchema = new mongoose.Schema({
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true },
  video_type: { type: Number, required: true },
  video_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  price: { type: Number, required: true },
  time: { type: String },
  type: { type: String },
  status: { type: Number, default: 1 }
}, {
  collection: 'rent_video',
  timestamps: true
});

// Relationships
rentVideoSchema.virtual('type_info', {
  ref: 'Type',
  localField: 'type_id',
  foreignField: '_id',
  justOne: true
});

rentVideoSchema.virtual('video_info', {
  ref: 'Video',
  localField: 'video_id',
  foreignField: '_id',
  justOne: true
});

rentVideoSchema.virtual('tvshow_info', {
  ref: 'TVShow',
  localField: 'video_id',
  foreignField: '_id',
  justOne: true
});

const RentVideo = mongoose.model('RentVideo', rentVideoSchema);

module.exports = RentVideo;
