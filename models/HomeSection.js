
const mongoose = require('mongoose');

// Enhanced Home Section Schema
const homeSectionSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g. "Top 10 Movies", "Trending Now"
  videos: [{
    videoId: { type: mongoose.Schema.Types.ObjectId, required: true },
    videoType: { type: String, required: true }, // instead of enum: [...]
    type: { type: String} // same here    
  }], // videos with their types
  isHomeScreen: { type: Boolean, default: false }, // Only shown on home screen if true
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true },

  // type: { 
  //   type: String, 
  //   enum: ['movie', 'web_series', 'tv_show', 'others', 'common','show'], 
  //   required: true 
  // }, // section type filter
  order: { type: Number, required: true },
  status: { type: Boolean, default: true }, // active/inactive section
  isCommon: { type: Boolean, default: false }, // flag for common sections that show all types
  description: { type: String }, // optional description
}, {
  collection: 'tbl_home_section',
  timestamps: true
});

const HomeSection = mongoose.model('HomeSection', homeSectionSchema);
module.exports = HomeSection;