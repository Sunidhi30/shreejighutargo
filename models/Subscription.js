
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  packageName: String,
  price: Number,
  duration: Number, // in days
  isActive: Boolean,
  startedAt: Date,
  expiresAt: Date
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
