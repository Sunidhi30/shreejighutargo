const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, required: true },
  time: { type: String, required: true },
  watch_on_laptop_tv: { type: String },
  ads_free_content: { type: Number },
  no_of_device_sync: { type: Number },
  android_product_package: { type: String },
  ios_product_package: { type: String },
  web_product_package: { type: String },
  status: { type: Number, default: 1 }
}, {
  collection: 'tbl_package',
  timestamps: true
});

const Package = mongoose.model('Package', packageSchema);

module.exports = Package;
