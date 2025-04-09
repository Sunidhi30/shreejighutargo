const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId, // assuming it's referencing a User
    required: true,
    ref: 'User'
  },
  video_type: {
    type: Number,
    required: true
  },
  sub_video_type: {
    type: Number,
    required: true
  },
  video_id: {
    type: mongoose.Schema.Types.ObjectId, // optional: you can use String if not using refs
    required: true
  },
  episode_id: {
    type: mongoose.Schema.Types.ObjectId, // optional: you can use String if not using refs
    required: false
  }
}, {
  collection: 'tbl_download',
  timestamps: true
});

const Download = mongoose.model('Download', downloadSchema);

module.exports = Download;
