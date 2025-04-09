const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    default: 1
  }
}, {
  collection: 'tbl_social_link',
  timestamps: true
});

const SocialLink = mongoose.model('SocialLink', socialLinkSchema);

module.exports = SocialLink;
