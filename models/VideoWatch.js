const mongoose = require('mongoose');
const videoWatchSchema = new mongoose.Schema({
  is_parent: {
    type: Number,
    default: 0 // 0 = sub-profile, 1 = parent, if applicable
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  video_type: {
    type: Number,
    required: true
  },
  sub_video_type: {
    type: Number,
    default: 0
  },
  video_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  episode_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  stop_time: {
    type: Number,
    default: 0 // in seconds or ms depending on your logic
  },
  status: {
    type: Number,
    default: 1
  }
}, {
  collection: 'tbl_video_watch',
  timestamps: true
});
const VideoWatch = mongoose.model('VideoWatch', videoWatchSchema);
module.exports = VideoWatch;
