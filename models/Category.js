

const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String, // URL or filename
    required: true,
  },
  status: {
    type: Number,
    default: 1, // assuming 1 is active, 0 is inactive
  }
}, {
  collection: 'tbl_category', // same as your Laravel table name
  timestamps: true, // optional: adds createdAt and updatedAt
});

module.exports = mongoose.model('Category', CategorySchema);
