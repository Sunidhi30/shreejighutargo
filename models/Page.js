const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  page_name: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  page_subtitle: { type: String },
  icon: { type: String },
  status: { type: Number, default: 1 }
}, {
  collection: 'tbl_page',
  timestamps: true
});

const Page = mongoose.model('Page', pageSchema);

module.exports = Page;
