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
