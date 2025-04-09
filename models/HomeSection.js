const mongoose = require('mongoose');

const homeSectionSchema = new mongoose.Schema({
  is_home_screen: { type: Number },
  type_id: { type: Number },
  video_type: { type: Number },
  sub_video_type: { type: Number },
  title: { type: String },
  short_title: { type: String },
  category_id: { type: Number },
  language_id: { type: Number },
  channel_id: { type: Number },
  order_by_upload: { type: Number },
  order_by_like: { type: Number },
  order_by_view: { type: Number },
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
