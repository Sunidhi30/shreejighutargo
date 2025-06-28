// // // models/Season.js
// // const mongoose = require('mongoose');

// // const seasonSchema = new mongoose.Schema({
// //   content: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
// //   seasonNumber: Number,
// //   episodes: [{
// //     title: String,
// //     description: String,
// //     videoUrl: String,
// //     duration: String
// //   }]
// // });

// // module.exports = mongoose.model('Season', seasonSchema);
// // models/Season.js

const mongoose = require('mongoose');

// const seasonSchema = new mongoose.Schema({
//   showId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'TVShow',
//     required: true
//   },
//   name: {
//     type: String,
//     required: false
//   },
//   status: {
//     type: Number,
//     required: false
//   }
// }, {
//   collection: 'tbl_season', 
//   timestamps: true
// });

// const Season = mongoose.model('Season', seasonSchema);

// module.exports = Season;

const seasonSchema = new mongoose.Schema({
    series_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
    seasonNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    releaseDate: { type: Date },
    total_like: { type: Number, default: 0 },
    totalEpisodes: { type: Number, default: 0 },
    ratings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        value: { type: Number, min: 1, max: 5 },
      }
    ],
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  }, {
    timestamps: true
  });
  
  module.exports = mongoose.model('Season', seasonSchema);