const mongoose = require('mongoose');

// Import your referenced models
const Video = require('./Video');
const TVShow = require('./TVShow');

const rentTransactionSchema = new mongoose.Schema({
  unique_id: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  video_type: { type: Number, required: true },
  video_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  price: { type: Number, required: true },
  transaction_id: { type: String },
  description: { type: String },
  status: { type: Number, default: 1 }
}, {
  collection: 'tbl_rent_transction',
  timestamps: true
});

// Relationship (populate)
rentTransactionSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Static method to get video name
rentTransactionSchema.statics.getVideoName = async function (video_id, video_type, sub_video_type) {
  if (video_type === 1) {
    const video = await Video.findById(video_id).select('name');
    return video?.name || "-";
  } else if (video_type === 2) {
    const show = await TVShow.findById(video_id).select('name');
    return show?.name || "-";
  } else if (video_type === 6) {
    if (sub_video_type === 1) {
      const video = await Video.findById(video_id).select('name');
      return video?.name || "-";
    } else if (sub_video_type === 2) {
      const show = await TVShow.findById(video_id).select('name');
      return show?.name || "-";
    }
  }
  return "-";
};

const RentTransaction = mongoose.model('RentTransaction', rentTransactionSchema);

module.exports = RentTransaction;
