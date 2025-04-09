const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String },
  message: { type: String },
  image: { type: String },
  status: { type: Number }
}, {
  collection: 'tbl_notification',
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
