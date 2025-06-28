const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: String,
  price: { 
    type: Number, 
    required: true 
  },
  duration: { 
    type: Number,  // in days
    required: true 
  },
 
  maxDevices: { 
    type: Number, 
    default: 1 
  },
  maxProfiles: { 
    type: Number, 
    default: 1 
  },
  maxScreens: { 
    type: Number, 
    default: 1 
  },

  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
