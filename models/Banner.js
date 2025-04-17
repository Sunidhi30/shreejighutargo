// const mongoose = require('mongoose');

// const bannerSchema = new mongoose.Schema({
//   is_home_screen: {
//     type: Number,
//     default: 0
//   },
//   type_id: {
//     type: mongoose.Schema.Types.ObjectId, // referencing Type model
//     ref: 'Type',
//     required: true
//   },
//   video_type: {
//     type: Number,
//     default: 0
//   },
//   subvideo_type: {
//     type: Number,
//     default: 0
//   },
//   video_id: {
//     type: mongoose.Schema.Types.ObjectId, // referencing Video model
//     ref: 'Video'
//   },
//   status: {
//     type: Number,
//     default: 1
//   },
//   // Optional: Add other banner fields like title, image, etc.
// }, {
//   collection: 'tbl_banner', // this maps to your MySQL table name
//   timestamps: true // if you want createdAt/updatedAt
// });

// module.exports = mongoose.model('Banner', bannerSchema);
// models/Banner.js
const mongoose = require('mongoose');
const bannerSchema = new mongoose.Schema({
  is_home_screen: { type: Number, default: 0 },  // 0 or 1
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' }, // Relationship with Type
  video_type: { type: String },  // assuming it's an enum/int
  subvideo_type: { type: Number },
  video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' }, // Relationship with Video
  status: { type: Number, default: 1 }, // Active/inactive
}, {
  collection: 'tbl_banner',
  timestamps: true
});
module.exports = mongoose.model('Banner', bannerSchema);
