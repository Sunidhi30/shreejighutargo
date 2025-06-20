// controllers/adController.js
const Ad = require('../models/Ad');
const AdSchedule = require('../models/AdSchedule');
const Video = require('../models/Video');

const adController = {
  // Create new ad
  async createAd(req, res) {
    try {
      const newAd = new Ad(req.body);
      await newAd.save();
      res.status(201).json(newAd);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Schedule ad for a video
  async scheduleAd(req, res) {
    try {
      const { video_id, ad_id, scheduleType, timePositions, intervalConfig } = req.body;

      // Verify video and ad exist
      const [video, ad] = await Promise.all([
        Video.findById(video_id),
        Ad.findById(ad_id)
      ]);

      if (!video || !ad) {
        return res.status(404).json({ error: 'Video or Ad not found' });
      }

      const adSchedule = new AdSchedule({
        video_id,
        ad_id,
        scheduleType,
        timePositions: timePositions?.map(time => ({ timestamp: time })),
        intervalConfig
      });

      await adSchedule.save();

      // Update video's ad configuration
      video.hasAds = true;
      video.ads.push(ad_id);
      await video.save();

      res.status(201).json(adSchedule);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get ad schedule for a video
  async getVideoAdSchedule(req, res) {
    try {
      const { videoId } = req.params;
      const adSchedules = await AdSchedule.find({ video_id: videoId })
        .populate('ad_id')
        .exec();

      res.status(200).json(adSchedules);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Track ad display
  async trackAdDisplay(req, res) {
    try {
      const { scheduleId, timestamp, success } = req.body;
      
      const adSchedule = await AdSchedule.findById(scheduleId);
      if (!adSchedule) {
        return res.status(404).json({ error: 'Ad schedule not found' });
      }

      // Update performance metrics
      adSchedule.performance.totalDisplays += 1;
      if (success) {
        adSchedule.performance.successfulDisplays += 1;
      } else {
        adSchedule.performance.failedDisplays += 1;
      }

      // If time-based, mark specific timestamp as displayed
      if (adSchedule.scheduleType === 'time-based') {
        const timePosition = adSchedule.timePositions.find(
          pos => pos.timestamp === timestamp
        );
        if (timePosition) {
          timePosition.displayed = true;
        }
      }

      await adSchedule.save();
      res.status(200).json(adSchedule);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = adController;
