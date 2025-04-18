
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  image: String,
  username: { type: String, unique: true },
  fullName: String,
  email: { type: String, unique: true },
  mobile: String,
  password: { type: String, required: true }, // <- Added field
  role: { type: String, default: 'vendor' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  uploadedContent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  wallet: { type: Number, default: 0 }, // Vendor's earning balance
  lockedBalance: { type: Number, default: 0 }, // Balance within 90-day lock period
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    swiftCode: String
  },
  paymentMethods: [{
    type: String,
    methodType: { type: String, enum: ['bank_transfer', 'paypal', 'stripe', 'other'] },
    details: mongoose.Schema.Types.Mixed
  }]
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
