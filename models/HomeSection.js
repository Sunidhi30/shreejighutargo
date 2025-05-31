

// const mongoose = require('mongoose');

// const homeSectionSchema = new mongoose.Schema({
//   title: { type: String, required: true }, // e.g. "Top 10 Movies", "Trending Now"
//   videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }], // selected videos
//   order: { type: Number, required: true },
//   status: { type: Boolean, default: true } // active/inactive section
// }, {
//   collection: 'tbl_home_section',
//   timestamps: true
// });

// const HomeSection = mongoose.model('HomeSection', homeSectionSchema);
// module.exports = HomeSection;

const mongoose = require('mongoose');

// Enhanced Home Section Schema
const homeSectionSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g. "Top 10 Movies", "Trending Now"
  videos: [{
    videoId: { type: mongoose.Schema.Types.ObjectId, required: true },
    videoType: { 
      type: String, 
      enum: ['movie', 'web_series', 'tv_show', 'others'], 
      required: true 
    }
  }], // videos with their types
  type: { 
    type: String, 
    enum: ['movie', 'web_series', 'tv_show', 'others', 'common'], 
    required: true 
  }, // section type filter
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