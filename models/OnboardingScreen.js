const mongoose = require('mongoose');

const onboardingScreenSchema = new mongoose.Schema({
  title: { type: String },
  image: { type: String },
  status: { type: Number }
}, {
  collection: 'tbl_onboarding_screen',
  timestamps: true
});

const OnboardingScreen = mongoose.model('OnboardingScreen', onboardingScreenSchema);

module.exports = OnboardingScreen;
