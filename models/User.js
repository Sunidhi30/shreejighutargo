const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
 
  email: { type: String, unique: true },
  role: { type: String, default: 'user' },
  otp: { type: String },
  otpExpiry: { type: Date },
  image: String, // profile image URL
  watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  lastLogin: {
    ip: String,
    device: String,
    location: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    time: Date,
  },
  // continueWatching: [
  //   {
  //     video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  //     progress: { type: Number, default: 0 }, // progress in seconds (or percentage if you want)
  //     lastWatched: { type: Date, default: Date.now }
  //   }
  // ],
  downloads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' }],
  rentedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  investedAmount: { type: Number, default: 0 },
  languagePreference: String,
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
