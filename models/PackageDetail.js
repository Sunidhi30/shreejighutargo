const mongoose = require('mongoose');

const packageDetailSchema = new mongoose.Schema({
  package_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Package' },
  package_key: { type: String, required: true },
  package_value: { type: String, required: true },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Vendor' }, // Add this

  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  }
}, {
  collection: 'tbl_package_detail',
  timestamps: true
});

const PackageDetail = mongoose.model('PackageDetail', packageDetailSchema);

module.exports = PackageDetail;
