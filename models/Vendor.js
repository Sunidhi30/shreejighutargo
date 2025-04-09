// const mongoose = require('mongoose');

// const vendorSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   companyName: {
//     type: String,
//     required: true
//   },
//   companyLogo: {
//     type: String
//   },
//   contactInfo: {
//     address: String,
//     phone: String,
//     website: String
//   },
//   paymentInfo: {
//     accountNumber: String,
//     bankName: String,
//     paypal: String,
//     stripe: String
//   },
//   verificationStatus: {
//     type: String,
//     enum: ['pending', 'verified', 'rejected'],
//     default: 'pending'
//   },
//   verificationDocuments: [{
//     type: String
//   }],
//   totalEarnings: {
//     type: Number,
//     default: 0
//   },
//   uploadedMovies: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Movie'
//   }],
//   contractDetails: {
//     startDate: Date,
//     endDate: Date,
//     termsAccepted: {
//       type: Boolean,
//       default: false
//     }
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('Vendor', vendorSchema);
// models/Vendor.js
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
