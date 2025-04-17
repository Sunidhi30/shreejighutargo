
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
  uploadedContent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }]
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
