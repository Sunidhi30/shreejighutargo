const Ad = require('../models/Ad');
const VideoAd = require('../models/videoAd');
const Video = require('../models/Video');

class AdController {
  
  // Create a new ad
  static async createAd(req, res) {
    try {
      const {
        ad_id,
        ad_name,
        ad_type,
        ad_provider,
        ad_url,
        ad_image,
        ad_video,
        duration
      } = req.body;
      // Check if ad_id already exists
      const existingAd = await Ad.findOne({ ad_id });
      if (existingAd) {
        return res.status(400).json({
          success: false,
          message: 'Ad ID already exists'
        });
      }

      const newAd = new Ad({
        ad_id,
        ad_name,
        ad_type,
        ad_provider,
        ad_url,
        ad_image,
        ad_video,
        duration,
        created_by: req.admin._id // Assuming admin auth middleware
      });

      await newAd.save();

      res.status(201).json({
        success: true,
        message: 'Ad created successfully',
        data: newAd
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating ad',
        error: error.message
      });
    }
  }

  // Assign ad to video
  static async assignAdToVideo(req, res) {
    try {
      const {
        video_id,
        ad_id,
        placement_type,
        position,
        duration,
        skip_after,
        priority,
        frequency,
        start_date,
        end_date
      } = req.body;

      // Verify video exists
      const video = await Video.findById(video_id);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      // Verify ad exists
      const ad = await Ad.findById(ad_id);
      if (!ad) {
        return res.status(404).json({
          success: false,
          message: 'Ad not found'
        });
      }

      // Check if this combination already exists
      const existingAssignment = await VideoAd.findOne({
        video_id,
        ad_id,
        placement_type,
        position: position || 0
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: 'This ad is already assigned to this video at this position'
        });
      }

      const videoAd = new VideoAd({
        video_id,
        ad_id,
        placement_type,
        position: position || 0,
        duration: duration || 15,
        skip_after: skip_after || 0,
        priority: priority || 1,
        frequency: frequency || 1,
        start_date: start_date ? new Date(start_date) : new Date(),
        end_date: end_date ? new Date(end_date) : null,
        created_by: req.admin._id
      });

      await videoAd.save();

      // Update video's hasAds flag
      await Video.findByIdAndUpdate(video_id, { hasAds: true });

      res.status(201).json({
        success: true,
        message: 'Ad assigned to video successfully',
        data: videoAd
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error assigning ad to video',
        error: error.message
      });
    }
  }

  // Get ads for a specific video (for video player)
  static async getVideoAds(req, res) {
    try {
      const { video_id } = req.params;

      const videoAds = await VideoAd.find({
        video_id,
        is_active: true,
        $or: [
          { end_date: { $exists: false } },
          { end_date: null },
          { end_date: { $gte: new Date() } }
        ]
      })
      .populate('ad_id')
      .sort({ placement_type: 1, priority: -1, position: 1 });

      // Group ads by placement type
      const groupedAds = {
        'pre-roll': [],
        'mid-roll': [],
        'post-roll': [],
        'banner-overlay': []
      };

      videoAds.forEach(videoAd => {
        if (videoAd.ad_id && videoAd.ad_id.is_active) {
          groupedAds[videoAd.placement_type].push({
            videoAd_id: videoAd._id,
            ad: videoAd.ad_id,
            position: videoAd.position,
            duration: videoAd.duration,
            skip_after: videoAd.skip_after,
            priority: videoAd.priority
          });
        }
      });

      res.status(200).json({
        success: true,
        data: groupedAds
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching video ads',
        error: error.message
      });
    }
  }

  // Get all ads
  static async getAllAds(req, res) {
    try {
      const ads = await Ad.find().sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        data: ads
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching ads',
        error: error.message
      });
    }
  }

  // Get all videos with their ads
  static async getVideosWithAds(req, res) {
    try {
      const videosWithAds = await Video.aggregate([
        {
          $lookup: {
            from: 'tbl_video_ads',
            localField: '_id',
            foreignField: 'video_id',
            as: 'videoAds'
          }
        },
        {
          $lookup: {
            from: 'tbl_ads',
            localField: 'videoAds.ad_id',
            foreignField: '_id',
            as: 'ads'
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            title: 1,
            thumbnail: 1,
            hasAds: 1,
            video_duration: 1,
            total_view: 1,
            videoAds: {
              $map: {
                input: '$videoAds',
                as: 'videoAd',
                in: {
                  _id: '$$videoAd._id',
                  placement_type: '$$videoAd.placement_type',
                  position: '$$videoAd.position',
                  duration: '$$videoAd.duration',
                  skip_after: '$$videoAd.skip_after',
                  is_active: '$$videoAd.is_active',
                  priority: '$$videoAd.priority',
                  ad: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$ads',
                          cond: { $eq: ['$$this._id', '$$videoAd.ad_id'] }
                        }
                      },
                      0
                    ]
                  }
                }
              }
            }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: videosWithAds
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching videos with ads',
        error: error.message
      });
    }
  }

  // Remove ad from video
  static async removeAdFromVideo(req, res) {
    try {
      const { videoAd_id } = req.params;

      const videoAd = await VideoAd.findByIdAndDelete(videoAd_id);
      
      if (!videoAd) {
        return res.status(404).json({
          success: false,
          message: 'Video ad assignment not found'
        });
      }

      // Check if video has any other ads, if not update hasAds flag
      const remainingAds = await VideoAd.countDocuments({ video_id: videoAd.video_id });
      if (remainingAds === 0) {
        await Video.findByIdAndUpdate(videoAd.video_id, { hasAds: false });
      }

      res.status(200).json({
        success: true,
        message: 'Ad removed from video successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error removing ad from video',
        error: error.message
      });
    }
  }

  // Update ad assignment
  static async updateVideoAd(req, res) {
    try {
      const { videoAd_id } = req.params;
      const updates = req.body;

      const videoAd = await VideoAd.findByIdAndUpdate(
        videoAd_id,
        updates,
        { new: true }
      ).populate('ad_id');

      if (!videoAd) {
        return res.status(404).json({
          success: false,
          message: 'Video ad assignment not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Video ad updated successfully',
        data: videoAd
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating video ad',
        error: error.message
      });
    }
  }

  // Track ad view/click
  static async trackAdInteraction(req, res) {
    try {
      const { videoAd_id, interaction_type } = req.body; // interaction_type: 'view' or 'click'

      const videoAd = await VideoAd.findById(videoAd_id);
      if (!videoAd) {
        return res.status(404).json({
          success: false,
          message: 'Video ad not found'
        });
      }

      if (interaction_type === 'view') {
        await VideoAd.findByIdAndUpdate(videoAd_id, { $inc: { views_count: 1 } });
        await Ad.findByIdAndUpdate(videoAd.ad_id, { $inc: { impression_count: 1 } });
      } else if (interaction_type === 'click') {
        await VideoAd.findByIdAndUpdate(videoAd_id, { $inc: { clicks_count: 1 } });
        await Ad.findByIdAndUpdate(videoAd.ad_id, { $inc: { click_count: 1 } });
      }

      res.status(200).json({
        success: true,
        message: 'Interaction tracked successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error tracking interaction',
        error: error.message
      });
    }
  }
}

module.exports = AdController;