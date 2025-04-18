const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  vendor_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vendor', 
    required: true 
  },
  video_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Video', 
    required: true 
  },
  package_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Package', 
    required: true 
  },
  transactionType: { 
    type: String, 
    enum: ['rental', 'view', 'ad'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  commissionRate: { 
    type: Number, 
    required: true 
  },
  isWithdrawn: { 
    type: Boolean, 
    default: false 
  },
  lockPeriodEndDate: { 
    type: Date,
    // Set default to 90 days from now
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 90);
      return date;
    }
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  transactionReference: String
}, { timestamps: true });

module.exports = mongoose.model('Commission', commissionSchema);
