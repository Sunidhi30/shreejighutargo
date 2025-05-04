const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  revenueType: { 
    type: String, 
    enum: ['rental', 'view', 'ad'], 
    required: true 
  },
  viewThreshold: { type: Number, default: 30 },
  commissionRate: { type: Number, default: 40 }, // Fixed at 40%
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  price: { type: Number, default: 0 },
  rentalDuration: { type: Number, default: 48 },
  status: { type: Boolean, default: true },

  customDetails: [{
    key: { type: String, required: false },
    value: { type: String, required: false}
  }]
}, { timestamps: true });

module.exports = mongoose.model('FinalPackage', packageSchema);
