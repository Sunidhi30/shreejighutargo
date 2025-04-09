// const mongoose = require('mongoose');

// const subscriptionSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   description: {
//     type: String
//   },
//   price: {
//     type: Number,
//     required: true
//   },
//   duration: {
//     type: Number,  // in days
//     required: true
//   },
//   features: [{
//     type: String
//   }],
//   maxDevices: {
//     type: Number,
//     default: 1
//   },
//   maxDownloads: {
//     type: Number,
//     default: 0
//   },
//   qualityOptions: [{
//     type: String,
//     enum: ['480p', '720p', '1080p', '4k']
//   }],
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('Subscription', subscriptionSchema);
// models/Subscription.js
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
