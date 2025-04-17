// // models/Season.js
// const mongoose = require('mongoose');

// const seasonSchema = new mongoose.Schema({
//   content: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
//   seasonNumber: Number,
//   episodes: [{
//     title: String,
//     description: String,
//     videoUrl: String,
//     duration: String
//   }]
// });

// module.exports = mongoose.model('Season', seasonSchema);
// models/Season.js

const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  showId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TVShow',
    required: true
  },
  name: {
    type: String,
    required: false
  },
  status: {
    type: Number,
    required: false
  }
}, {
  collection: 'tbl_season', 
  timestamps: true
});

const Season = mongoose.model('Season', seasonSchema);

module.exports = Season;
