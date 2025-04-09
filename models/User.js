// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   user_name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   full_name: {
//     type: String,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   mobile_number: {
//     type: String
//   },
//   image_type: {
//     type: Number,
//     default: 0
//   },
//   image: {
//     type: String
//   },
//   type: {
//     type: Number,
//     default: 1 // 1 = user, 2 = admin? adjust if needed
//   },
//   parent_control_status: {
//     type: Number,
//     default: 0
//   },
//   parent_control_password: {
//     type: String
//   },
//   status: {
//     type: Number,
//     default: 1
//   }
// }, {
//   collection: 'tbl_user',
//   timestamps: true
// });

// // Optional: Hash password before saving
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   try {
//     this.password = await bcrypt.hash(this.password, 10);
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// const User = mongoose.model('User', userSchema);

// module.exports = User;
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  profileImage: String,
  fullName: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  mobile: String,
  role: { type: String, default: 'user' },
  password: String,
  otp: { type: String },
  otpExpiry: { type: Date },
  watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  downloads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' }],
  rentedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  languagePreference: String,
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
