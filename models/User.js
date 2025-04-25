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
  downloads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' }],
  rentedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  investedAmount: { type: Number, default: 0 },
  languagePreference: String,
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
