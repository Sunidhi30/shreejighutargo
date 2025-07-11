
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  image: String,
  username: { type: String, unique: true },
  fullName: String,
  email: { type: String, unique: true },
  mobile: String,
  monthlyTarget: Number,
  monthlyTargetUser:Number,
  totalViews: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  totalVideos: { type: Number, default: 0 },
  password: { type: String, required: true }, // <- Added field
  role: { type: String, default: 'vendor' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  uploadedContent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  wallet: { type: Number, default: 0 }, // Vendor's earning balance
  lockedBalance: { type: Number, default: 0 }, // Balance within 90-day lock period
  totalEarningsFromViews: { type: Number, default: 0 }, // 🆕 Separate variable to store total earnings from views
  viewsEarningsHistory: [{ // 🆕 Track individual earnings transactions
    date: { type: Date, default: Date.now },
    viewsCount: Number,
    pricePerView: Number,
    grossEarnings: Number, // Total before admin cut
    vendorEarnings: Number, // Vendor's 40% share
    adminEarnings: Number // Admin's 60% share
  }],
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    swiftCode: String
  },
  walletLockDays: { type: Number, default: 0 }, // Days the wallet is locked
  walletLockStartDate: { type: Date }, // When the lock started
  walletLockEndDate: { type: Date }, // When the lock will end
  upiId: { type: String }, // Optional UPI ID for payments
  resetToken: String,
resetTokenExpiry: Date,
monthlyTargetVideo:Number,
  paymentMethods: [{
    type: String,
    methodType: { type: String, enum: ['bank_transfer', 'paypal', 'stripe', 'other'] },
    details: mongoose.Schema.Types.Mixed
  }]
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
