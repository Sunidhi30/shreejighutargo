
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  
  email: { type: String, unique: true },
  otp: { type: String },
  otpExpiry: { type: Date },
  role: { type: String, default: 'admin' },
  profileImage: { type: String }, // 👈 New field for profile picture
  targetAmount: { type: Number, default: 0 },  // 👈 Add this line
  pricePerView: { type: Number, default: 1 } , // ✅ Add this
  adminPercentage: { type: Number, default: 60 }, // Admin gets 60%
  vendorPercentage: { type: Number, default: 40 }, // Vendor gets 40%
  totalEarningsFromViews: { type: Number, default: 0 }, // 🆕 Admin's total earnings from views

  wallet: { type: Number, default: 0 } , // Admin's wallet balance

  defaultWalletLockDays: { type: Number, default: 90 }, // Default lock period

  notificationDays: { type: Number, default: 2 }, // Days before expiry to send notification
  emailSettings: {
    smtpHost: String,
    smtpPort: Number,
    smtpUser: String,
    smtpPassword: String,
    fromEmail: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
