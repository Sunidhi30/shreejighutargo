const mongoose = require('mongoose');

const tvLoginSchema = new mongoose.Schema({
  unique_code: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: Number,
    default: 1 // 1 for active, 0 for inactive or other states
  }
}, {
  collection: 'tbl_tv_login',
  timestamps: true
});

const TvLogin = mongoose.model('TvLogin', tvLoginSchema);

module.exports = TvLogin;
