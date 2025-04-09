const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  portrait_img: {
    type: String,
    required: true
  },
  landscape_img: {
    type: String,
    required: true
  },
  is_title: {
    type: Number,
    default: 0
  },
  status: {
    type: Number,
    default: 1
  }
}, {
  collection: 'tbl_channel', // Matches Laravel's table name
  timestamps: true
});

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;
