
const cron = require('node-cron');
const Contest = require('../models/Contest');
const Video = require('../models/Video');
const Series = require('../models/Series');
const TVShow = require('../models/TVShow');
const Dynamic = require('../models/DynamicVideo');

// Run every minute to check for contests that should start or process registrations
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    // console.log('Running cron job at:', now);
    
    // 🔴 UPDATED: Find contests that need registration-to-participant processing
    const contestsToProcess = await Contest
      .find({
        $or: [
          // Contests that should transition to active
          {
            status: { $in: ['registration_closed', 'registration_open'] },
            startDate: { $lte: now },
            endDate: { $gt: now }
          },
          // 🔴 NEW: Active contests that might have unprocessed registrations
          {
            status: 'active',
            startDate: { $lte: now },
            endDate: { $gt: now },
            // Only process if there are registrations that aren't in participants
            $expr: {
              $gt: [
                { $size: "$registrations" },
                { $size: "$participants" }
              ]
            }
          }
        ]
      })
      .populate('type_id', 'name');

    // console.log(`Found ${contestsToProcess.length} contests to process`);

    for (const contest of contestsToProcess) {
      // console.log(`Processing contest: ${contest.title} (Status: ${contest.status})`);
      
      // Get contest type for model mapping
      const contestType = contest.type_id.name;
      const modelMap = {
        movie: Video,
        webseries: Series,
        show: TVShow,
        others: Dynamic
      };
      const VideoModel = modelMap[contestType];
      
      if (!VideoModel) {
        console.error(`Invalid contest type: ${contestType}`);
        continue;
      }

      let newParticipantsAdded = 0;

      // Move all registered vendors to participants
      for (const registration of contest.registrations) {
        // Skip if already a participant
        const alreadyParticipant = contest.participants.some(p => 
          p.vendor_id.equals(registration.vendor_id) && 
          p.video_id.equals(registration.video_id)
        );
        
        if (alreadyParticipant) {
          // console.log(`Vendor ${registration.vendor_id} already a participant`);
          continue;
        }

        try {
          // Fetch the video to get initial views
          const video = await VideoModel.findById(registration.video_id);
          if (!video) {
            console.error(`Video not found: ${registration.video_id}`);
            continue;
          }

          // Add to participants
          contest.participants.push({
            vendor_id: registration.vendor_id,
            video_id: registration.video_id,
            joinedAt: now,
            initialViews: video.total_view || 0,
            contestViews: 0,
            adminAdjustedViews: 0,
            totalContestViews: 0
          });

          newParticipantsAdded++;
          // console.log(`Added vendor ${registration.vendor_id} to participants`);
        } catch (error) {
          console.error(`Error processing registration for vendor ${registration.vendor_id}:`, error);
        }
      }

      // Update contest status to active if it wasn't already
      if (contest.status !== 'active') {
        contest.status = 'active';
      }

      // Save the contest
      await contest.save();
      
      console.log(`Contest ${contest._id} (${contest.title}) processed: ${newParticipantsAdded} new participants added. Total participants: ${contest.participants.length}`);
    }

    // 🔴 SEPARATE: Handle contest status transitions
    // Close registration for contests whose registration period has ended
    const contestsToCloseRegistration = await Contest.find({
      status: 'registration_open',
      registrationEndDate: { $lte: now },
      startDate: { $gt: now } // Contest hasn't started yet
    });

    for (const contest of contestsToCloseRegistration) {
      contest.status = 'registration_closed';
      await contest.save();
      console.log(`Contest ${contest._id} registration is now closed`);
    }

    // Mark completed contests
    const contestsToComplete = await Contest.find({
      status: 'active',
      endDate: { $lte: now }
    });

    for (const contest of contestsToComplete) {
      contest.status = 'completed';
      await contest.save();
      console.log(`Contest ${contest._id} is now completed`);
    }

  } catch (error) {
    console.error('Cron job error:', error);
  }
});

// 🔴 OPTIONAL: Manual trigger endpoint for immediate processing
// Add this to your routes if you want to manually trigger participant updates
/*
router.post('/contests/:id/process-registrations', async (req, res) => {
  try {
    const contest = await Contest
      .findById(req.params.id)
      .populate('type_id', 'name');
    
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    const now = new Date();
    if (now < contest.startDate) {
      return res.status(400).json({ success: false, message: 'Contest has not started yet' });
    }

    const contestType = contest.type_id.name;
    const modelMap = {
      movie: Video,
      webseries: Series,
      show: TVShow,
      others: Dynamic
    };
    const VideoModel = modelMap[contestType];

    let processedCount = 0;

    for (const registration of contest.registrations) {
      const alreadyParticipant = contest.participants.some(p => 
        p.vendor_id.equals(registration.vendor_id) && 
        p.video_id.equals(registration.video_id)
      );
      
      if (alreadyParticipant) continue;

      const video = await VideoModel.findById(registration.video_id);
      if (!video) continue;

      contest.participants.push({
        vendor_id: registration.vendor_id,
        video_id: registration.video_id,
        joinedAt: now,
        initialViews: video.total_view || 0,
        contestViews: 0,
        adminAdjustedViews: 0,
        totalContestViews: 0
      });

      processedCount++;
    }

    contest.status = 'active';
    await contest.save();

    res.json({
      success: true,
      message: `Processed ${processedCount} registrations to participants`,
      totalParticipants: contest.participants.length
    });

  } catch (error) {
    console.error('Manual processing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
*/