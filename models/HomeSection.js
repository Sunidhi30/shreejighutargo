const mongoose = require('mongoose');

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
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }] , // <-- ADD THIS,
  status: { type: Number }
}, {
  collection: 'tbl_home_section',
  timestamps: true
});
const HomeSection = mongoose.model('HomeSection', homeSectionSchema);
 module.exports = HomeSection;
