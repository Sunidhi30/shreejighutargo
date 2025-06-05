
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

  // defaultWalletLockDays: { type: Number, default: 90 }, // Default lock period
  // 🆕 Bank Account Details for Admin Transactions
  bankDetails: {
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },
    accountHolderName: { type: String },
    branchName: { type: String },
    accountType: { type: String, enum: ['savings', 'current'], default: 'savings' },
    isVerified: { type: Boolean, default: false }
  },
  
  // 🆕 Razorpay Configuration
  razorpayConfig: {
    keyId: { type: String },
    keySecret: { type: String },
    webhookSecret: { type: String },
    isActive: { type: Boolean, default: false }
  },
  
  // 🆕 UPI Details (Alternative payment method)
  upiDetails: {
    upiId: { type: String },
    qrCode: { type: String }, // Base64 encoded QR code or URL
    isActive: { type: Boolean, default: false }
  },
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
