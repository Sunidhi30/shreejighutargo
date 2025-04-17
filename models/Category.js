// const mongoose = require('mongoose');

// const categorySchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },
//   description: {
//     type: String
//   },
//   icon: {
//     type: String
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   displayOrder: {
//     type: Number,
//     default: 0
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('Category', categorySchema);


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
