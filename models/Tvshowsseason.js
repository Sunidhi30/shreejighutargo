// // models/Season.js
// const mongoose = require('mongoose');

// const seasonSchema = new mongoose.Schema({
//   show_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'TVShow',
//     required: true
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   description: String,
//   status: {
//     type: Number,
//     default: 1
//   }
// }, {
//   collection: 'tbl_season',
//   timestamps: true
// });

// module.exports = mongoose.model('TVSeason', seasonSchema);
const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  show_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TVShow',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: Number,
    default: 1 // 1 = active, 0 = inactive (optional interpretation)
  }
}, {
  collection: 'tbl_season',
  timestamps: true
});

module.exports = mongoose.model('TVSeason', seasonSchema);
