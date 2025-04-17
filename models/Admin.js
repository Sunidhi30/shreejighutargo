
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  
  email: { type: String, unique: true },
  otp: { type: String },
  otpExpiry: { type: Date },
  role: { type: String, default: 'admin' },
  profileImage: { type: String }, // 👈 New field for profile picture
  targetAmount: { type: Number, default: 0 },  // 👈 Add this line
  wallet: { type: Number, default: 0 }  // Admin's wallet balance

}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
