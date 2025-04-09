// models/TopTen.js
const mongoose = require('mongoose');

const topTenSchema = new mongoose.Schema({
  type: { type: String, enum: ['movie', 'webseries', 'short'] },
  contents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  updatedAt: Date
});

module.exports = mongoose.model('TopTen', topTenSchema);
