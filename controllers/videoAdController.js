const Video = require('../models/Video');
const Ad = require('../models/Ad');

class VideoAdController {
  
  // Add ad to video
  static async addAdToVideo(req, res) {
    try {
      const { videoId, adId, placement, showAt, isSkippable, skipAfter } = req.body;
      
      // Validate required fields
      if (!videoId || !adId || !placement) {
        return res.status(400).json({
          success: false,
          message: 'Video ID, Ad ID, and placement are required'
        });
      }
      
      // Check if video exists
      const video = await Video.findById(videoId);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }
      
      // Check if ad exists and is approved
      const ad = await Ad.findById(adId);
      if (!ad) {
        return res.status(404).json({
          success: false,
          message: 'Ad not found'
        });
      }
      
    //   if (!ad.isApproved) {
    //     return res.status(400).json({
    //       success: false,
    //       message: 'Ad is not approved yet'
    //     });
    //   }
      
      // Check if ad is already added to this video
      if (video.ads.includes(adId)) {
        return res.status(400).json({
          success: false,
          message: 'Ad is already added to this video'
        });
      }
      
      // Validate placement-specific requirements
      if (placement === 'mid-roll' && (!showAt || showAt <= 0)) {
        return res.status(400).json({
          success: false,
          message: 'Mid-roll ads require a valid showAt timestamp'
        });
      }
      
      // Add ad to video's ads array
      video.ads.push(adId);
      
      // Create ad break entry
      const adBreak = {
        position: placement === 'pre-roll' ? 0 : 
                 placement === 'post-roll' ? video.video_duration : showAt,
        duration: ad.duration || 30, // Default 30 seconds
        type: placement,
        ad_id: adId,
        isSkippable: isSkippable !== undefined ? isSkippable : true,
        skipAfter: skipAfter || 5
      };
      
      video.adBreaks.push(adBreak);
      
      // Enable ads for this video
      video.hasAds = true;
      
      // Initialize ad configuration if not exists
      if (!video.adConfiguration) {
        video.adConfiguration = {
          hasAds: true,
          adDensity: 'medium',
          skipAfter: 5,
          maxAdsPerSession: 3
        };
      }
      
      await video.save();
      
      res.status(200).json({
        success: true,
        message: 'Ad successfully added to video',
        data: {
          videoId: video._id,
          adId: ad._id,
          adBreak: adBreak
        }
      });
      
    } catch (error) {
      console.error('Error adding ad to video:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  // Remove ad from video
  static async removeAdFromVideo(req, res) {
    try {
      const { videoId, adId } = req.params;
      
      const video = await Video.findById(videoId);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }
      
      // Remove ad from ads array
      video.ads = video.ads.filter(id => id.toString() !== adId);
      
      // Remove associated ad breaks
      video.adBreaks = video.adBreaks.filter(
        adBreak => adBreak.ad_id.toString() !== adId
      );
      
      // Disable ads if no ads remaining
      if (video.ads.length === 0) {
        video.hasAds = false;
      }
      
      await video.save();
      
      res.status(200).json({
        success: true,
        message: 'Ad successfully removed from video'
      });
      
    } catch (error) {
      console.error('Error removing ad from video:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  // Get all ads for a video
  static async getVideoAds(req, res) {
    try {
      const { videoId } = req.params;
      
      const video = await Video.findById(videoId)
        .populate({
          path: 'ads',
        //   match: { isApproved: true }, // Only show approved ads
          select: 'title adType placement android ios impressions clicks revenue'
        })
        .populate({
          path: 'adBreaks.ad_id',
          select: 'title adType duration'
        });
      
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          videoId: video._id,
          hasAds: video.hasAds,
          ads: video.ads,
          adBreaks: video.adBreaks,
          adConfiguration: video.adConfiguration
        }
      });
      
    } catch (error) {
      console.error('Error fetching video ads:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  // Update ad configuration for video
  static async updateAdConfiguration(req, res) {
    try {
      const { videoId } = req.params;
      const { adDensity, skipAfter, maxAdsPerSession } = req.body;
      
      const video = await Video.findById(videoId);
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }
      
      // Update ad configuration
      video.adConfiguration = {
        ...video.adConfiguration,
        adDensity: adDensity || video.adConfiguration?.adDensity || 'medium',
        skipAfter: skipAfter || video.adConfiguration?.skipAfter || 5,
        maxAdsPerSession: maxAdsPerSession || video.adConfiguration?.maxAdsPerSession || 3
      };
      
      await video.save();
      
      res.status(200).json({
        success: true,
        message: 'Ad configuration updated successfully',
        data: video.adConfiguration
      });
      
    } catch (error) {
      console.error('Error updating ad configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  // Get ads for video playback (client-side)
  static async getVideoAdsForPlayback(req, res) {
    try {
      const { videoId } = req.params;
      const { platform } = req.query; // 'android' or 'ios'
      
      const video = await Video.findById(videoId)
        .populate({
          path: 'adBreaks.ad_id',
          match: { 
            // isApproved: true,
            'schedule.isActive': true,
            $or: [
              { 'schedule.endDate': { $gte: new Date() } },
              { 'schedule.endDate': null }
            ]
          }
        });
      
      if (!video || !video.hasAds) {
        return res.status(200).json({
          success: true,
          data: { hasAds: false, adBreaks: [] }
        });
      }
      
      // Filter ad breaks based on platform and active ads
      const activeAdBreaks = video.adBreaks.filter(adBreak => {
        const ad = adBreak.ad_id;
        if (!ad) return false;
        
        // Check platform-specific settings
        if (platform === 'android' && !ad.android.enabled) return false;
        if (platform === 'ios' && !ad.ios.enabled) return false;
        
        return true;
      }).map(adBreak => ({
        position: adBreak.position,
        duration: adBreak.duration,
        type: adBreak.type,
        isSkippable: adBreak.isSkippable,
        skipAfter: adBreak.skipAfter,
        ad: {
          _id: adBreak.ad_id._id,
          title: adBreak.ad_id.title,
          adType: adBreak.ad_id.adType,
          mediaUrl: adBreak.ad_id.mediaUrl,
          clickUrl: adBreak.ad_id.clickUrl,
          adId: platform === 'android' ? 
                adBreak.ad_id.android.adId : 
                adBreak.ad_id.ios.adId
        }
      }));
      
      res.status(200).json({
        success: true,
        data: {
          hasAds: true,
          adBreaks: activeAdBreaks,
          adConfiguration: video.adConfiguration
        }
      });
      
    } catch (error) {
      console.error('Error fetching ads for playback:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  // Track ad impression
  static async trackAdImpression(req, res) {
    try {
      const { videoId, adId } = req.body;
      
      // Update ad impressions
      await Ad.findByIdAndUpdate(adId, {
        $inc: { impressions: 1 }
      });
      
      // Update video ad performance
      await Video.findByIdAndUpdate(videoId, {
        $inc: { 'adPerformance.totalImpressions': 1 },
        $set: { 'adPerformance.lastAdServed': new Date() }
      });
      
      res.status(200).json({
        success: true,
        message: 'Ad impression tracked'
      });
      
    } catch (error) {
      console.error('Error tracking ad impression:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
  
  // Track ad click
  static async trackAdClick(req, res) {
    try {
      const { videoId, adId, platform } = req.body;
      
      // Update ad clicks
      const updateField = platform === 'android' ? 
        'android.clickCount' : 'ios.clickCount';
      
      await Ad.findByIdAndUpdate(adId, {
        $inc: { 
          clicks: 1,
          [updateField]: 1
        }
      });
      
      // Update video ad performance
      await Video.findByIdAndUpdate(videoId, {
        $inc: { 'adPerformance.totalClicks': 1 }
      });
      
      res.status(200).json({
        success: true,
        message: 'Ad click tracked'
      });
      
    } catch (error) {
      console.error('Error tracking ad click:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = VideoAdController;