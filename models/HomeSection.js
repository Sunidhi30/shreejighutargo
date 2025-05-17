const mongoose = require('mongoose');

// // const homeSectionSchema = new mongoose.Schema({
// //   is_home_screen: { type: Number },
// //   type_id: { type: Number },
// //   video_type: { type: Number },
// //   sub_video_type: { type: Number },
// //   title: { type: String },
// //   short_title: { type: String },
// //   category_id: { type: Number },
// //   language_id: { type: Number },
// //   channel_id: { type: Number },
// //   order_by_upload: { type: Number },
// //   order_by_like: { type: Number },
// //   order_by_view: { type: Number },
// //   screen_layout: { type: String },
// //   premium_video: { type: Number },
// //   rent_video: { type: Number },
// //   no_of_content: { type: Number },
// //   view_all: { type: Number },
// //   sortable: { type: Number },
// //   status: { type: Number }
// // }, {
// //   collection: 'tbl_home_section',
// //   timestamps: true
// // });

// // const HomeSection = mongoose.model('HomeSection', homeSectionSchema);

// // module.exports = HomeSection;
// const mongoose = require('mongoose');

// const homeSectionSchema = new mongoose.Schema({
//   is_home_screen: { type: String },
//   type_id: { type: String },
//   video_type: { type: String },
//   sub_video_type: { type: String },
//   title: { type: String },
//   short_title: { type: String },
//   category_id: { type: String },
//   language_id: { type: String },
//   channel_id: { type: String },
//   order_by_upload: { type: String },
//   order_by_like: { type: String },
//   order_by_view: { type: String },
//   screen_layout: { type: String },
//   premium_video: { type: String },
//   rent_video: { type: String },
//   no_of_content: { type: String },
//   view_all: { type: String },
//   sortable: { type: String },
//   status: { type: String }
// }, {
//   collection: 'tbl_home_section',
//   timestamps: true
// });

// const HomeSection = mongoose.model('HomeSection', homeSectionSchema);

// module.exports = HomeSection;


const homeSectionSchema = new mongoose.Schema({
  is_home_screen: { type: Number },  // or Boolean
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
  video_type: { type: Number },
  sub_video_type: { type: Number },
  title: { type: String },
  short_title: { type: String },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  language_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Language' },
  channel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  order_by_upload: { type: String },
  order_by_like: { type: String },
  order_by_view: { type: String },
  screen_layout: { type: String },
  premium_video: { type: Number },
  rent_video: { type: Number },
  no_of_content: { type: Number },
  view_all: { type: Number },
  sortable: { type: Number },
  status: { type: Number }
}, {
  collection: 'tbl_home_section',
  timestamps: true
});
const HomeSection = mongoose.model('HomeSection', homeSectionSchema);

 module.exports = HomeSection;