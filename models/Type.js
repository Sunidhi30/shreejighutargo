const mongoose = require('mongoose');
const TypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: Number,
    required: false,
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
// 1: 'Movie',   2: 'show',
  // 3: 'web-series',
  // 4: 'Short videos',
  // 5: 'Kids',6: 'Stand-up Comedy',