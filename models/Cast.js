// // models/Cast.js
// const mongoose = require('mongoose');

// const castSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   image: { type: String }, // Cloudinary URL
//   role: { type: String }   // e.g. "Actor", "Director"
// }, { timestamps: true });

// module.exports = mongoose.model('Cast', castSchema);


const mongoose = require('mongoose');

const CastSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String, // Cloudinary image URL
    required: true,
  },
  type: {
    type: String, // e.g., Actor, Director, etc.
    required: true,
  },
  personal_info: {
    type: String, // description or biography
  },
  status: {
    type: Number,
    default: 1, // 1 = active, 0 = inactive
  }
}, {
  collection: 'tbl_cast',
  timestamps: true // optional
});

module.exports = mongoose.model('Cast', CastSchema);
