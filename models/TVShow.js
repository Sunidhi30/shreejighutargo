const mongoose = require('mongoose');

const tvShowSchema = new mongoose.Schema({
  type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Type',
    required: true
  },
  video_type: Number,
  channel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  producer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producer'
  },
  category_id: String, // Could be ObjectId[] if stored as array
  language_id: String, // Could be ObjectId[] if stored as array
  cast_id: String,     // Could be ObjectId[] if stored as array
  name: String,
  thumbnail: String,
  landscape: String,
  trailer_type: String,
  trailer_url: String,
  description: String,
  release_date: String,
  is_title: {
    type: Number,
    default: 0
  },
  is_like: {
    type: Number,
    default: 0
  },
  is_comment: {
    type: Number,
    default: 1
  },
  total_like: {
    type: Number,
    default: 0
  },
  total_view: {
    type: Number,
    default: 0
  },
  is_rent: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  rent_day: {
    type: Number,
    default: 0
  },
  status: {
    type: Number,
    default: 1
  }
}, {
  collection: 'tbl_tv_show',
  timestamps: true
});

const TVShow = mongoose.model('TVShow', tvShowSchema);

module.exports = TVShow;
