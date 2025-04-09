const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  unique_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  amount_type: {
    type: Number,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  is_use: {
    type: Number,
    default: 0
  },
  status: {
    type: Number,
    default: 1
  }
}, {
  collection: 'tbl_coupon',
  timestamps: true
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
