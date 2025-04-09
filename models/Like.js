const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user_id: { type: Number },
  video_type: { type: Number },
  video_id: { type: Number },
  episode_id: { type: Number },
  status: { type: Number }
}, {
  collection: 'tbl_like',
  timestamps: true
});

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;
