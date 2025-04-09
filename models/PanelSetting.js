const mongoose = require('mongoose');

const panelSettingSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String }
}, {
  collection: 'tbl_panel_setting',
  timestamps: true
});

const PanelSetting = mongoose.model('PanelSetting', panelSettingSchema);

module.exports = PanelSetting;
