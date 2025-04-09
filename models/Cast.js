// models/Cast.js
const mongoose = require('mongoose');

const castSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String }, // Cloudinary URL
  role: { type: String }   // e.g. "Actor", "Director"
}, { timestamps: true });

module.exports = mongoose.model('Cast', castSchema);
