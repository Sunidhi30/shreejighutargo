
const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: { type: String, required: false }, // e.g., "Rental", "Pay-per-view", "Ad-supported"
  description: String,
  revenueType: { 
    type: String, 
    enum: ['rental', 'view', 'ad'], 
    required: false
  },
  viewThreshold: { 
    type: Number, 
    default: 30 // Default percentage (30%) of video that must be watched to count as a view
  },
  commissionRate: { 
    type: Number, 
    required: true // Percentage commission for vendor
  },
  price: { 
    type: Number, 
    default: 0 // Price for rental packages
  },
  rentalDuration: { 
    type: Number, 
    default: 48 // Hours for rental validity
  },
  status: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);