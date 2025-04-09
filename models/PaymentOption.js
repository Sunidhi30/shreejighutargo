const mongoose = require('mongoose');

const paymentOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  visibility: { type: String },
  is_live: { type: String },
  key_1: { type: String },
  key_2: { type: String },
  key_3: { type: String },
  key_4: { type: String }
}, {
  collection: 'tbl_payment_option',
  timestamps: true
});

const PaymentOption = mongoose.model('PaymentOption', paymentOptionSchema);

module.exports = PaymentOption;
