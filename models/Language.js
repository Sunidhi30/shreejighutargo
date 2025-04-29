

const mongoose = require('mongoose');

const LanguageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String, // Cloudinary image URL
    required: true,
  },
  status: {
    type: Number,
    default: 1, // active by default
  }
}, {
  collection: 'tbl_language', // same as Laravel
  timestamps: true, // optional
});

module.exports = mongoose.model('Language', LanguageSchema);
