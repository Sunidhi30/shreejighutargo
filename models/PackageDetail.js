const mongoose = require('mongoose');

const packageDetailSchema = new mongoose.Schema({
  package_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Package' },
  package_key: { type: String, required: true },
  package_value: { type: String, required: true }
}, {
  collection: 'tbl_package_detail',
  timestamps: true
});

const PackageDetail = mongoose.model('PackageDetail', packageDetailSchema);

module.exports = PackageDetail;
