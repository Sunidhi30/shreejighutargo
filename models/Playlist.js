// models/Playlist.js

const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    title: { type: String, required: true },
    description: { type: String },
    thumbnail: { type: String },
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
    isPublic: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0 }
  }, {
    timestamps: true
  });
  
  module.exports = mongoose.model('Playlist', playlistSchema);