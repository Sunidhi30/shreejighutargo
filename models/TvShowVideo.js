const mongoose = require('mongoose');

const tvShowVideoSchema = new mongoose.Schema({
  show_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TVShow',
    required: true
  },
  season_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true
  },
  name: String,
  thumbnail: String,
  landscape: String,
  description: String,
  video_upload_type: String,
  video_320: String,
  video_480: String,
  video_720: String,
  video_1080: String,
  video_extension: String,
  video_duration: Number,
  subtitle_type: String,
  subtitle_lang_1: String,
  subtitle_1: String,
  subtitle_lang_2: String,
  subtitle_2: String,
  subtitle_lang_3: String,
  subtitle_3: String,
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
  total_view: {
    type: Number,
    default: 0
  },
  total_like: {
    type: Number,
    default: 0
  },
  sortable: {
    type: Number,
    default: 0
  },
  status: {
    type: Number,
    default: 1
  }
}, {
  collection: 'tbl_tv_show_video',
  timestamps: true
});

const TvShowVideo = mongoose.model('TvShowVideo', tvShowVideoSchema);

module.exports = TvShowVideo;
