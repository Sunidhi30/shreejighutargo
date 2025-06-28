const Ad = require('../models/Ad');
const VideoAd = require('../models/videoAd');
const Video = require('../models/Video');

class AdController {
  
  // Create new ad
  static async createAd(req, res) {
    try {
      const adData = req.body;
      
      // Validate required fields
      if (!adData.title || !adData.adType) {
        return res.status(400).json({
          success: false,
          message: 'Title and ad type are required'
        });
      }
      
      const ad = new Ad(adData);
      await ad.save();
      
      res.status(201).json({
        success: true,
        message: 'Ad created successfully',
        data: ad
      });
      
    } catch (error) {
      console.error('Error creating ad:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  // Get all ads with filtering
  static async getAllAds(req, res) {
    try {
      const { 
        adType, 
     
        platform, 
        page = 1, 
        limit = 10,
        vendor_id 
      } = req.query;
      
      // Build filter object
      const filter = {};
      if (adType) filter.adType = adType;

      if (vendor_id) filter.vendor_id = vendor_id;
      
      // Platform-specific filtering
      if (platform === 'android') {
        filter['android.enabled'] = true;
      } else if (platform === 'ios') {
        filter['ios.enabled'] = true;
      }
      
      const skip = (page - 1) * limit;
      
      const ads = await Ad.find(filter)
        .populate('vendor_id', 'name email')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Ad.countDocuments(filter);
      
      res.status(200).json({
        success: true,
        data: {
          ads,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });
      
    } catch (error) {
      console.error('Error fetching ads:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  // Update ad
  static async updateAd(req, res) {
    try {
      const { adId } = req.params;
      const updateData = req.body;
      
      const ad = await Ad.findByIdAndUpdate(
        adId, 
        updateData, 
        { new: true, runValidators: true }
      );
      
      if (!ad) {
        return res.status(404).json({
          success: false,
          message: 'Ad not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Ad updated successfully',
        data: ad
      });
      
    } catch (error) {
      console.error('Error updating ad:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  // Approve/Reject ad
  // static async approveAd(req, res) {
  //   try {
  //     const { adId } = req.params;
     
  //     const adminId = req.admin._id; // Assuming admin auth middleware
      
  //     const ad = await Ad.findByIdAndUpdate(
  //       adId,
  //       {
  //         isApproved,
  //         approvedBy: adminId,
  //         approvalDate: new Date(),
  //         approvalNote
  //       },
  //       { new: true }
  //     );
      
  //     if (!ad) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'Ad not found'
  //       });
  //     }
      
  //     res.status(200).json({
  //       success: true,
  //       message: `Ad ${isApproved ? 'approved' : 'rejected'} successfully`,
  //       data: ad
  //     });
      
  //   } catch (error) {
  //     console.error('Error approving ad:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Internal server error',
  //       error: error.message
  //     });
  //   }
  // }
  
  // Delete ad
  static async deleteAd(req, res) {
    try {
      const { adId } = req.params;
      
      // Remove ad from all videos first
      await Video.updateMany(
        { ads: adId },
        { 
          $pull: { 
            ads: adId,
            adBreaks: { ad_id: adId }
          }
        }
      );
      
      // Delete the ad
      const ad = await Ad.findByIdAndDelete(adId);
      
      if (!ad) {
        return res.status(404).json({
          success: false,
          message: 'Ad not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Ad deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting ad:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
  
  // Get ad analytics
  static async getAdAnalytics(req, res) {
    try {
      const { adId } = req.params;
      const { startDate, endDate } = req.query;
      
      const ad = await Ad.findById(adId);
      if (!ad) {
        return res.status(404).json({
          success: false,
          message: 'Ad not found'
        });
      }
      
      // Calculate CTR (Click Through Rate)
      const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions * 100).toFixed(2) : 0;
      
      // Get videos using this ad
      const videosWithAd = await Video.find({ ads: adId })
        .select('title total_view adPerformance')
        .limit(10);
      
      res.status(200).json({
        success: true,
        data: {
          ad: {
            _id: ad._id,
            title: ad.title,
            adType: ad.adType,
      
          },
          metrics: {
            impressions: ad.impressions,
            clicks: ad.clicks,
            revenue: ad.revenue,
            ctr: `${ctr}%`,
            androidClicks: ad.android.clickCount,
            iosClicks: ad.ios.clickCount
          },
          videosUsing: videosWithAd
        }
      });
      
    } catch (error) {
      console.error('Error fetching ad analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = AdController;