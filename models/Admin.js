
// const mongoose = require('mongoose');

// const adminSchema = new mongoose.Schema({
//   user_name: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: true,
//     select: false // This hides password when fetching
//   },
//   status: {
//     type: Number,
//     default: 1,
//   }
// }, {
//   collection: 'tbl_admin', // Same as Laravel's $table = 'tbl_admin'
//   timestamps: true // Similar to Laravel's created_at & updated_at
// });

// const Admin = mongoose.model('Admin', adminSchema);



// module.exports = Admin;
// models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  
  email: { type: String, unique: true },
  otp: { type: String },
  otpExpiry: { type: Date },
  role: { type: String, default: 'admin' }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
