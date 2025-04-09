const mongoose = require('mongoose');

const deviceSyncSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId, // assuming relation with User
    required: true,
    ref: 'User'
  },
  device_name: {
    type: String,
    required: true
  },
  device_id: {
    type: String,
    required: true
  },
  device_type: {
    type: Number,
    required: true
  },
  device_token: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    default: 1
  }
}, {
  collection: 'tbl_device_sync',
  timestamps: true
});

const DeviceSync = mongoose.model('DeviceSync', deviceSyncSchema);

module.exports = DeviceSync;
