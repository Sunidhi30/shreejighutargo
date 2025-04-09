const mongoose = require('mongoose');

const subProfileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  parent_user_id: {
    type: mongoose.Schema.Types.ObjectId, // assuming referencing the main user
    ref: 'User',
    required: true
  },
  status: {
    type: Number,
    default: 1 // assuming 1 = active
  }
}, {
  collection: 'tbl_sub_profile',
  timestamps: true
});

const SubProfile = mongoose.model('SubProfile', subProfileSchema);

module.exports = SubProfile;
