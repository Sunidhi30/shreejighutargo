// const mongoose = require('mongoose');

// const typeSchema = new mongoose.Schema({
//   type: {
//     type: String,
//     enum: ['video', 'show', 'upcoming', 'channel', 'kids','webSeries','shortVideos'],
//     required: true
//   },
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   isVisible: {
//     type: Boolean,
//     default: true
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('Type', typeSchema);
const mongoose = require('mongoose');

const TypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: Number,
    required: true,
  },
  status: {
    type: Number,
    default: 1, // assuming 1 = active
  }
}, {
  collection: 'tbl_type', // matches Laravel's protected $table = 'tbl_type'
  timestamps: true // optional: adds createdAt and updatedAt
});

module.exports = mongoose.model('Type', TypeSchema);
