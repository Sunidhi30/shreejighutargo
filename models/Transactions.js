const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  type: {
    type: String,
    enum: ['rental', 'purchase', 'subscription'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'wallet'],
    required: true
  },
  paymentDetails: {
    gateway: String,
    transactionId: String,
    lastFour: String  // last 4 digits of credit card
  },
  itemDetails: {
    itemType: {
      type: String,
      enum: ['movie', 'subscription']
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'itemDetails.itemType'
    }
  },
  receiptUrl: {
    type: String
  },
  vendorShare: {
    type: Number
  },
  platformFee: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);