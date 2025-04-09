const mongoose = require('mongoose');

const readNotificationSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  notification_id: { type: Number, required: true },
  status: { type: Number, default: 1 }
}, {
  collection: 'tbl_read_notification',
  timestamps: true
});

const ReadNotification = mongoose.model('ReadNotification', readNotificationSchema);

module.exports = ReadNotification;
