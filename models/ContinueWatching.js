const mongoose = require('mongoose');

// // const continueWatchingSchema = new mongoose.Schema({
// //   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
// //   // videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
// //   videoId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     required: true,
// //     refPath: 'contentType' // Dynamic reference
// //   },
// //   contentType: {
// //     type: String,
// //     required: true,
// //     enum: ['Video', 'Episode', 'TVShowEpisode'] // You can expand this list
// //   },
// //   progress: { type: Number, default: 0 }, // in seconds
// //   updatedAt: { type: Date, default: Date.now }
// // });

// // module.exports = mongoose.model('ContinueWatching', continueWatchingSchema);
// // Continue Watching Schema

// // Continue Watching Schema


// const continueWatchingSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   contentId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true
//   },
//   video_type: {
//     type: String,
//     required: true,
//     enum: ['movie', 'series', 'show']
//   },
//   progress: {
//     type: Number,
//     default: 0,
//     min: 0,
//     max: 100
//   },
//   lastWatchedAt: {
//     type: Date,
//     default: Date.now
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('ContinueWatching', continueWatchingSchema);



const continueWatchingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentModel'
  },
  contentModel: {
    type: String,
    required: true,
    enum: ['Video', 'TVEpisode', 'Episode']
  },
  video_type: {
    type: String,
    required: true,
    enum: ['movie', 'series', 'show']
  },
  progress: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });
module.exports = mongoose.model('ContinueWatching', continueWatchingSchema);
