const mongoose = require('mongoose');
const Video = require('./Video');
const TVShow = require('./TVShow');
const User = require('./User');

const commentSchema = new mongoose.Schema({
  comment_id: {
    type: Number,
    default: null
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
    default: null
  },
  video_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  episode_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  comment: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    default: 1
  }
}, {
  collection: 'tbl_comment',
  timestamps: true
});

// Relation (populate user)
commentSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Static method: getVideoName
commentSchema.statics.getVideoName = async function (video_id, video_type, sub_video_type) {
  try {
    if (video_type === 1) {
      const video = await Video.findById(video_id).select('name');
      return video?.name || '-';
    } else if (video_type === 2) {
      const tvShow = await TVShow.findById(video_id).select('name');
      return tvShow?.name || '-';
    } else if (video_type === 6) {
      if (sub_video_type === 1) {
        const video = await Video.findById(video_id).select('name');
        return video?.name || '-';
      } else if (sub_video_type === 2) {
        const tvShow = await TVShow.findById(video_id).select('name');
        return tvShow?.name || '-';
      }
    }
    return '-';
  } catch (err) {
    console.error(err);
    return '-';
  }
};

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
