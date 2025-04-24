
const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Rental", "Pay-per-view", "Ad-supported"
  description: { type: String, default: '' },
  revenueType: { 
    type: String, 
    enum: ['rental', 'view', 'ad'], 
    required: true 
  },
  viewThreshold: { 
    type: Number, 
    default: 30 
  },
  commissionRate: { 
    type: Number, 
    required: true 
  },
  maxRentalPrice: {
    type: Number,
    required: true,
  },
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor', // Reference to the Vendor model
    required: true
  },
  price: { 
    type: Number, 
    default: 0 
  },
  rentalDuration: { 
    type: Number, 
    default: 48 
  },
  status: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);
