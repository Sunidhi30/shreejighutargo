const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  pricePerLike: { type: Number, required: true }, // Price per like set by the admin
  adminPercentage: { type: Number, required: true }, // Percentage of earnings for admin
  vendorPercentage: { type: Number, required: true }, // Percentage of earnings for vendor
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
