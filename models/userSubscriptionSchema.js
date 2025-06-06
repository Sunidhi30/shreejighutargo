// // 2. Create the user subscription schema (to track user subscriptions)
// const mongoose= require("mongoose")
// const userSubscriptionSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   plan: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'SubscriptionPlan',
//     required: true
//   },
//   startDate: {
//     type: Date,
//     default: Date.now
//   },
//   endDate: {
//     type: Date,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['active', 'expired', 'canceled'],
//     default: 'active'
//   },
//   autoRenew: {
//     type: Boolean,
//     default: true
//   },
//   paymentMethod: {
//     type: String,
//     required: true
//   },
//   paymentId: String,
//   transactionId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Transaction'
//   }
// }, { timestamps: true });

// module.exports  = mongoose.model('UserSubscription', userSubscriptionSchema);
// Updated UserSubscription Schema

const mongoose = require("mongoose");

const userSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Add index for better query performance
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true // Add index for expiration queries
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'canceled'],
    default: 'active',
    index: true // Add index for status queries
  },
  autoRenew: {
    type: Boolean,
    default: false // Changed to false for better control
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentId: {
    type: String,
    required: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  // Additional fields for better tracking
  activatedAt: {
    type: Date,
    default: Date.now
  },
  canceledAt: {
    type: Date
  },
  cancelReason: {
    type: String
  }
}, { 
  timestamps: true,
  // Compound index to prevent duplicate active subscriptions
  index: [
    { user: 1, status: 1, endDate: 1 },
    { user: 1, plan: 1, status: 1 }
  ]
});

// Prevent duplicate active subscriptions for same user
userSubscriptionSchema.index(
  { user: 1, status: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: 'active' },
    name: 'unique_active_subscription'
  }
);

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
