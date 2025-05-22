// models/VendorLockPeriod.js
const mongoose = require('mongoose');

const vendorLockPeriodSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    unique: true // Only one lock period per vendor
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  lockPeriodDays: {
    type: Number,
    required: true,
    min: 1,
    default: 90
  },
  startDate: {
    type: Date,
    default: Date.now // When the lock period starts (vendor's first earning day)
  },
  endDate: {
    type: Date // no longer `required`, we calculate it in pre-save
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reason: {
    type: String,
    default: 'Standard earning lock period'
  },
  totalLockedAmount: {
    type: Number,
    default: 0 // Track total amount locked during this period
  }
}, {
  timestamps: true
});

// Calculate endDate before saving
vendorLockPeriodSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('lockPeriodDays') || this.isModified('startDate')) {
    const endDate = new Date(this.startDate);
    endDate.setDate(endDate.getDate() + this.lockPeriodDays);
    this.endDate = endDate;
  }
  next();
});

// Instance method to check if lock is still active
vendorLockPeriodSchema.methods.isLockActive = function() {
  return this.isActive && new Date() < this.endDate;
};

// Instance method to get remaining days
vendorLockPeriodSchema.methods.getRemainingDays = function() {
  if (!this.isLockActive()) return 0;
  const diffTime = this.endDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Static method to find active lock period for a vendor
vendorLockPeriodSchema.statics.findActiveLockPeriod = function(vendorId) {
  return this.findOne({
    vendorId,
    isActive: true,
    endDate: { $gt: new Date() }
  });
};

module.exports = mongoose.model('VendorLockPeriod', vendorLockPeriodSchema);
