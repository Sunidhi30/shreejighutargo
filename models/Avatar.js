// models/Avatar.js

const mongoose = require('mongoose');

const AvatarSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    default: 1,
  }
}, {
  collection: 'tbl_avatar', // Equivalent to protected $table = 'tbl_avatar'
  timestamps: true,         // Optional: Adds createdAt and updatedAt
});

module.exports = mongoose.model('Avatar', AvatarSchema);
