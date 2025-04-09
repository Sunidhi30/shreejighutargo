const mongoose = require('mongoose');

const generalSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  }
}, {
  collection: 'tbl_general_setting',
  timestamps: true
});

const GeneralSetting = mongoose.model('GeneralSetting', generalSettingSchema);

module.exports = GeneralSetting;
