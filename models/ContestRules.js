const mongoose = require('mongoose');

const contestRulesSchema = new mongoose.Schema({
  contest_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest' },
  generalRules: [{
    rule: String,
    description: String
  }],
  eligibilityCriteria: {
    minVideoCount: { type: Number, default: 1 }, // Minimum videos vendor should have
    minAccountAge: { type: Number, default: 30 }, // Account age in days
    allowedVideoTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Type' }],
    minVideoDuration: { type: Number }, // in seconds
    maxVideoDuration: { type: Number }, // in seconds
    requiredVideoQuality: [String], // e.g., ['720p', '1080p']
  },
  submissionGuidelines: {
    allowExistingVideos: { type: Boolean, default: true },
    maxSubmissionsPerVendor: { type: Number, default: 1 },
    contentRestrictions: [String],
    thumbnailRequirements: {
      minWidth: Number,
      minHeight: Number,
      maxSize: Number, // in MB
      allowedFormats: [String]
    }
  },
  disqualificationCriteria: [String],
  termsAndConditions: [String],
  privacyPolicy: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('ContestRules', contestRulesSchema);
