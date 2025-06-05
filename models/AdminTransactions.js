const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { 
    type: String, 
    unique: true, 
    required: true 
  },
  razorpayOrderId: { type: String }, // Razorpay order ID
  razorpayPaymentId: { type: String }, // Razorpay payment ID
  razorpaySignature: { type: String }, // Razorpay signature for verification
  
  type: { 
    type: String, 
    enum: ['deposit', 'withdrawal', 'refund', 'commission', 'penalty', 'bonus'], 
    required: true 
  },
  
  amount: { 
    type: Number, 
    required: true 
  },
  
  currency: { 
    type: String, 
    default: 'INR' 
  },
  
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'cancelled', 'processing'], 
    default: 'pending' 
  },
  
  paymentMethod: { 
    type: String, 
    enum: ['card', 'netbanking', 'upi', 'wallet', 'bank_transfer', 'cash'], 
    required: true 
  },
  
  // Admin reference
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin', 
    required: true 
  },
  
  // Optional vendor reference (for commission transactions)
  vendorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vendor' 
  },
  
  description: { 
    type: String, 
    required: true 
  },
  
  // Payment gateway response
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Bank details used for transaction
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Transaction fees
  fees: {
    amount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 }
  },
  
  // Timestamps for different stages
  initiatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  failedAt: { type: Date },
  
}, { timestamps: true });

// Create indexes for faster queries
transactionSchema.index({ adminId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('AdminTransaction', transactionSchema);