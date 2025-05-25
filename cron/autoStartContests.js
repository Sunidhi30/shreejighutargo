const cron = require('node-cron');
const Contest = require('../models/Contest');
const Video = require('../models/Video');

// Schedule: Every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    console.log('Checking contests to start at:', now.toISOString());

    // Find contests whose start time has passed and are not yet active
    const contestsToStart = await Contest.find({
        status: { $in: ['upcoming', 'draft'] },
        startDate: { $lte: now }
      });
      console.log(contestsToStart.status);
    for (const contest of contestsToStart) {
      console.log(`⏳ Starting contest ${contest._id} automatically...`);

      for (const registration of contest.registrations) {
        if (registration.status === 'approved') {
          const video = await Video.findById(registration.video_id);
          if (!video) continue;

          contest.participants.push({
            vendor_id: registration.vendor_id,
            video_id: registration.video_id,
            initialViews: video.total_view || 0,
            contestViews: 0,
            adminAdjustedViews: 0,
            totalContestViews: 0
          });

          registration.status = 'joined';
        }
      }

      contest.status = 'active';
      await contest.save();

      console.log(`✅ Contest ${contest._id} started successfully.`);
    }
  } catch (error) {
    console.error('❌ Error in contest auto-start cron:', error.message);
  }
});
