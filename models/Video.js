const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  type_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Type'
  },
  video_type: {
    type: Number,
    default: 0
  },
  channel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  producer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producer'
  },
  category_id: {
    type: String
  },
  language_id: {
    type: String
  },
  cast_id: {
    type: String
  },
  name: {
    type: String
  },
  thumbnail: {
    type: String
  },
  landscape: {
    type: String
  },
  description: {
    type: String
  },
  video_upload_type: {
    type: String
  },
  video_320: {
    type: String
  },
  video_480: {
    type: String
  },
  video_720: {
    type: String
  },
  video_1080: {
    type: String
  },
  video_extension: {
    type: String
  },
  video_duration: {
    type: Number
  },
  trailer_type: {
    type: String
  },
  trailer_url: {
    type: String
  },
  subtitle_type: {
    type: String
  },
  subtitle_lang_1: {
    type: String
  },
  subtitle_1: {
    type: String
  },
  subtitle_lang_2: {
    type: String
  },
  subtitle_2: {
    type: String
  },
  subtitle_lang_3: {
    type: String
  },
  subtitle_3: {
    type: String
  },
  release_date: {
    type: String // Or Date if you want proper date handling
  },
  is_premium: {
    type: Number,
    default: 0
  },
  is_title: {
    type: Number,
    default: 0
  },
  is_download: {
    type: Number,
    default: 0
  },
  is_like: {
    type: Number,
    default: 0
  },
  is_comment: {
    type: Number,
    default: 0
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
  collection: 'tbl_video',
  timestamps: true
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
