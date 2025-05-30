// // ===== UPDATED SCHEMAS =====

// // Contest Schema (MODIFIED)
// const mongoose = require('mongoose');

// const contestSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: String,
//   rules: { type: String, required: true }, // 🔴 ADDED: Contest rules and regulations
//   judgingCriteria: String, // 🔴 ADDED: How winners will be determined
//   type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true },
//   startDate: { type: Date, required: true },
//   endDate: { type: Date, required: true },
//   registrationStartDate: { type: Date, required: true }, // 🔴 ADDED: When registration opens
//   registrationEndDate: { type: Date, required: true }, // 🔴 ADDED: When registration closes
//   prizes: [{
//     position: Number,
//     prizeAmount: Number,
//     description: String
//   }],
//   // status: {
//   //   type: String,
//   //   enum: ['draft', 'registration_open', 'registration_closed', 'active', 'completed', 'cancelled'], // 🔴 MODIFIED: Added more statuses
//   //   default: 'draft'
//   // },
//   // in contestSchema.registrations:
// status: {
//   type: String,
//   enum: ['joined'],     // only “joined” now
//   default: 'joined'
// },

//   registrations: [{
//     vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
//     video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
//     registrationDate: { type: Date, default: Date.now },
//     status: {
//       type: String,
//       enum: ['pending', 'approved', 'rejected', 'joined'],
//       default: 'pending'
//     },
//     notificationSent: { type: Boolean, default: false }
//   }],
//   participants: [{
//     vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
//     video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
//     joinedAt: { type: Date, default: Date.now },
//     initialViews: { type: Number, default: 0 }, // Views when joined
//     contestViews: { type: Number, default: 0 }, // Views during contest (admin can modify)
//     adminAdjustedViews: { type: Number, default: 0 }, // 🔴 ADDED: Views added by admin
//     totalContestViews: { type: Number, default: 0 }, // 🔴 ADDED: contestViews + adminAdjustedViews
//     rank: { type: Number }
//   }],
//   viewsUpdateHistory: [{ // 🔴 ADDED: Track admin view adjustments
//     vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
//     video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
//     viewsAdded: Number,
//     updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
//     updatedAt: { type: Date, default: Date.now },
//     note: String
//   }],
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
// }, { timestamps: true });

// module.exports = mongoose.model('Contest', contestSchema);
// ===== FIXED CONTEST SCHEMA =====




const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  rules: { type: String, required: true },
  judgingCriteria: String,
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationStartDate: { type: Date, required: true },
  registrationEndDate: { type: Date, required: true },
  prizes: [{
    position: Number,
    prizeAmount: Number,
    description: String
  }],
  // 🔴 UNCOMMENTED AND FIXED: Main contest status
  status: {
    type: String,
    enum: ['draft', 'registration_open', 'registration_closed', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  registrations: [{
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    registrationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'joined'],
      default: 'joined' // 🔴 CHANGED: Default to 'joined' since you want auto-approval
    },
    notificationSent: { type: Boolean, default: false }
  }],
  participants: [{
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },

    video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    videoDuration: Number, // in seconds (store this when uploading)

    joinedAt: { type: Date, default: Date.now },
    initialViews: { type: Number, default: 0 },
    contestViews: { type: Number, default: 0 },
    adminAdjustedViews: { type: Number, default: 0 },
    contestViewsOnly: { type: Number, default: 0 },
adminAdjustedViews: { type: Number, default: 0 },
totalContestViews: { type: Number, default: 0 },
lastViewUpdate: { type: Date, default: Date.now },
uniqueViewers: [{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ipAddress: String,
  viewedAt: { type: Date, default: Date.now }
}],
    
    rank: { type: Number }
  }],
  viewsUpdateHistory: [{
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    viewsAdded: Number,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedAt: { type: Date, default: Date.now },
    note: String
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Contest', contestSchema);
