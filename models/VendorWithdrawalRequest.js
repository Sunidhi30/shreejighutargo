// New Withdrawal Request Schema
const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  vendorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vendor', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 1
  },
  bankDetails: {
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankName: { type: String, required: true },
    ifscCode: { type: String, required: true },
    holderName: { type: String, required: true }
  },
  upiId: { type: String }, // Optional
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'], 
    default: 'pending' 
  },
  requestDate: { type: Date, default: Date.now },
  approvalDate: { type: Date },
  completionDate: { type: Date },
  adminNotes: { type: String },
  rejectionReason: { type: String },
  lockDaysRemaining: { type: Number }, // Days remaining when request was made
  canWithdraw: { type: Boolean, default: false } // Whether withdrawal is allowed
}, { timestamps: true });



const VendorWithdrawalRequest = mongoose.model('VendorsWithdrawalRequest', withdrawalRequestSchema);

module.exports = VendorWithdrawalRequest;