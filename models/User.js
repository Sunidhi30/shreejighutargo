// const mongoose = require('mongoose');
// const userSchema = new mongoose.Schema({
 
//   email: { type: String, unique: true },
//   role: { type: String, default: 'user' },
//   otp: { type: String },
//   otpExpiry: { type: Date },
//   profileImage: String, // profile image URL
//   watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
//   device_name:{ type :String },
//       device_type:{ type :String } ,
//       device_token:{ type :String },
//       device_id:{ type :String },
//   lastLogin: {
//     ip: String,
//     device: String,
//     location: String,
//     coordinates: {
//       lat: Number,
//       lng: Number,
//     },
//     time: Date,
//   },
//   deviceSessions: [
//     {
//       ip: String,
//       device: String,
//       location: String,
//       coordinates: {
//         lat: Number,
//         lng: Number,
//       },
//       time: Date,
//     }
//   ],
//   downloads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
//   subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' }],
//   rentedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
//   transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
//   investedAmount: { type: Number, default: 0 },
//   languagePreference: String,
//   favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],  // This line was added
//   deleted: { type: Boolean, default: false }
// }, { timestamps: true });

// module.exports = mongoose.model('User', userSchema);


const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  role: { type: String, default: 'user' },
  otp: { type: String },
  otpExpiry: { type: Date },
  profileImage: String, // profile image URL
  watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
  device_name: { type: String },
  device_type: { type: String },
  device_token: { type: String },
  device_id: { type: String },
  
  // Netflix-like profiles
  profiles: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    avatar: { type: String, default: 'https://in.bmscdn.com/iedb/artist/images/website/poster/large/pankaj-tripathi-29809-23-03-2017-02-54-29.jpg' },
    isKid: { type: Boolean, default: false },
    pin: { type: String }, // Optional PIN for profile access
    watchHistory: [{
      contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
      watchedAt: { type: Date, default: Date.now },
      progress: { type: Number, default: 0 }, // Progress in seconds
      completed: { type: Boolean, default: false }
    }],
    preferences: {
      language: { type: String, default: 'en' },
      maturityRating: { type: String, default: 'PG-13' }, // G, PG, PG-13, R, NC-17
      autoplay: { type: Boolean, default: true },
      subtitles: { type: Boolean, default: false }
    },
    myList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
    createdAt: { type: Date, default: Date.now }
  }],
  
  lastLogin: {
    ip: String,
    device: String,
    location: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    time: Date,
  },
  deviceSessions: [
    {
      ip: String,
      device: String,
      location: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      time: Date,
    }
  ],
  downloads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' }],
  rentedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  investedAmount: { type: Number, default: 0 },
  languagePreference: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

// Create default profile when user is created
userSchema.pre('save', function(next) {
  if (this.isNew && (!this.profiles || this.profiles.length === 0)) {
    this.profiles = [{
      name: 'Main Profile',
      avatar: 'default-avatar.png',
      isKid: false,
      preferences: {
        language: this.languagePreference || 'en',
        maturityRating: 'PG-13'
      }
    }];
  }
  next();
});

module.exports = mongoose.model('User', userSchema);