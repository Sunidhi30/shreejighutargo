const mongoose = require('mongoose');

const rentPriceListSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  android_product_package: { type: String },
  ios_product_package: { type: String },
  web_price_id: { type: String },
  status: { type: Number, default: 1 }
}, {
  collection: 'tbl_rent_price_list',
  timestamps: true
});

const RentPriceList = mongoose.model('RentPriceList', rentPriceListSchema);

module.exports = RentPriceList;
