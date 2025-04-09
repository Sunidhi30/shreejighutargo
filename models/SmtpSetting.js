const mongoose = require('mongoose');

const smtpSettingSchema = new mongoose.Schema({
  protocol: {
    type: String,
    required: true
  },
  host: {
    type: String,
    required: true
  },
  port: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  pass: {
    type: String,
    required: true
  },
  from_name: {
    type: String,
    required: true
  },
  from_email: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    default: 1
  }
}, {
  collection: 'tbl_smtp_setting',
  timestamps: true
});

const SmtpSetting = mongoose.model('SmtpSetting', smtpSettingSchema);

module.exports = SmtpSetting;
