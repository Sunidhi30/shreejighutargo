// // // models/Language.js
// // const languageSchema = new mongoose.Schema({
// //   name: String
// // });
// // module.exports = mongoose.model('Language', languageSchema);
// const mongoose = require('mongoose');

// const languageSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },
//   image: {
//     type: String, // Cloudinary URL
//     required: true
//   },
//   isActive: {
//     type: Boolean,
//     default: true // Always true by default, not set from frontend
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('Language', languageSchema);
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
