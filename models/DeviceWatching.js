const mongoose = require('mongoose');

const deviceWatchingSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId, // assuming reference to User model
    required: true,
    ref: 'User'
  },
  device_id: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    default: 1
  }
}, {
  collection: 'tbl_device_watching',
  timestamps: true
});

// Optional: You can populate device_sync info via manual queries or virtuals
deviceWatchingSchema.virtual('device_sync', {
  ref: 'DeviceSync',
  localField: 'device_id',
  foreignField: 'device_id',
  justOne: true
});

deviceWatchingSchema.set('toObject', { virtuals: true });
deviceWatchingSchema.set('toJSON', { virtuals: true });

const DeviceWatching = mongoose.model('DeviceWatching', deviceWatchingSchema);

module.exports = DeviceWatching;
