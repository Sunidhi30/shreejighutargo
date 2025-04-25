const express = require('express');
const router = express.Router();
const multer = require('multer');
const RentalLimit = require("../models/RentalLimit");
const cloudinary = require('cloudinary').v2;
const { uploadToCloudinary } = require("../utils/cloudinary");
const Movie = require('../models/Movie');
const Vendors = require("../models/Vendor");
const storage = multer.memoryStorage();
const Package = require("../models/Package")
const {isVendor}= require("../middleware/auth")
const upload = multer({ storage: storage });
const Vendor = require("../models/Vendor");
const crypto = require('crypto');
const DEFAULT_IMAGE_URL = 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg'; // Set your default static image URL
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Content = require("../models/Content");
const category = require("../models/Category")
const UpcomingContent = require('../models/UpcomingContent');
const  Video = require("../models/Video");
const Channel = require("../models/Channel");
const Category = require("../models/Category");
const PackageDetail = require("../models/PackageDetail")
const mongoose = require("mongoose");
// Configucre Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
// Fields for upload
const uploadFields = [
  { name: 'video', maxCount: 1 },
  { name: 'poster', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'subtitle_1', maxCount: 1 },
  { name: 'subtitle_2', maxCount: 1 },
  { name: 'subtitle_3', maxCount: 1 }
];
//vendor login
router.post('/vendor-login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: 'Email/Username and password are required' });
    }

    // Find vendor by email or username
    const vendor = await Vendor.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { vendorId: vendor._id, role: 'vendor' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(200).json({
      message: 'Login successful',
      token,
      vendor: {
        _id: vendor._id,
        username: vendor.username,
        email: vendor.email,
        status: vendor.status
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// update the profile of the vendor 
router.put('/update-profile', isVendor, upload.single('image'), async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { username, password } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    console.log('Before Update -> Vendor Image:', vendor.image);

    if (username) vendor.username = username;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      vendor.password = hashedPassword;
    }

    if (req.file) {
      const file = req.file;
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const cloudinaryUrl = await uploadToCloudinary(base64, 'vendors/profile', file.mimetype);

      console.log('Cloudinary result:', cloudinaryUrl);
      if (cloudinaryUrl) {
        vendor.image = cloudinaryUrl;
      } else {
        console.log('Cloudinary did not return a secure_url');
      }
    }

    await vendor.save();
    console.log('After Save -> Vendor Image:', vendor.image);

    const { password: _, ...vendorData } = vendor.toObject(); // exclude password

    res.status(200).json({
      success: true,
      message: 'Vendor profile updated successfully',
      vendor: vendorData
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});
//upload video  (its simple uploading without doing the rentals videos and all )
router.post(
  '/create-video',isVendor,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'landscape', maxCount: 1 },
    { name: 'video_320', maxCount: 1 },
    { name: 'video_480', maxCount: 1 },
    { name: 'video_720', maxCount: 1 },
    { name: 'video_1080', maxCount: 1 },
    { name: 'trailer', maxCount: 1 }
  ]),
  async (req, res) => {
    console.log(req.body)

    try {
      
       // Validate package
       const package = await Package.findById(req.body.package_id);
       if (!package) {
         return res.status(400).json({
           success: false,
           message: 'Invalid package selected'
         });
       }
      const { 
        type_id, video_type,channel_id, producer_id, category_id,
        language_id, cast_id, name, description, video_upload_type, video_extension,
        video_duration, trailer_type, subtitle_type, subtitle_lang_1, subtitle_1,
        subtitle_lang_2, subtitle_2, subtitle_lang_3, subtitle_3, release_date, is_premium,
        is_title, is_download, is_like, is_comment, total_like, total_view, is_rent, price,
        rent_day,monetizationType
      } = req.body;
      const vendorId = req.vendor.id;
      console.log("", vendorId);
      console.log(req.body)
      let thumbnailUrl = '', landscapeUrl = '', video_320Url = '', video_480Url = '', video_720Url = '', video_1080Url = '', trailerUrl = '';

      const uploadFile = async (field, folder) => {
        if (req.files[field]) {
          const file = req.files[field][0];
          const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          return await uploadToCloudinary(base64, folder, file.mimetype);
        }
        return '';
      };

      thumbnailUrl = await uploadFile('thumbnail', 'videos/thumbnails');
      landscapeUrl = await uploadFile('landscape', 'videos/landscapes');
      video_320Url = await uploadFile('video_320', 'videos/320');
      video_480Url = await uploadFile('video_480', 'videos/480');
      video_720Url = await uploadFile('video_720', 'videos/720');
      video_1080Url = await uploadFile('video_1080', 'videos/1080');
      trailerUrl = await uploadFile('trailer', 'videos/trailers');

      const newVideo = new Video({
        type_id: type_id ? new mongoose.Types.ObjectId(type_id) : null,
        video_type,
        vendor_id: new mongoose.Types.ObjectId(vendorId),
        channel_id: channel_id ? new mongoose.Types.ObjectId(channel_id) : null,
        producer_id: producer_id ? new mongoose.Types.ObjectId(producer_id) : null,
        category_id: category_id ? new mongoose.Types.ObjectId(category_id) : null,
        language_id: language_id ? new mongoose.Types.ObjectId(language_id) : null,
        cast_id: cast_id ? new mongoose.Types.ObjectId(cast_id) : null,
        name,
        monetizationType,
        thumbnail: thumbnailUrl,
        landscape: landscapeUrl,
        description,
        video_upload_type,
        video_320: video_320Url,
        video_480: video_480Url,
        video_720: video_720Url,
        video_1080: video_1080Url,
        video_extension,
        video_duration: Number(video_duration),
        trailer_type,
        trailer_url: trailerUrl,
        subtitle_type,
        subtitle_lang_1,
        subtitle_1,
        subtitle_lang_2,
        subtitle_2,
        subtitle_lang_3,
        subtitle_3,
        release_date,
        is_premium: Number(is_premium),
        is_title: Number(is_title),
        is_download: Number(is_download),
        is_like: Number(is_like),
        is_comment: Number(is_comment),
        total_like: Number(total_like),
        total_view: Number(total_view),
        is_rent: Number(is_rent),
        price: Number(price),
        rent_day: Number(rent_day),
        status:"pending",
        isApproved: false,
        packageType: package.revenueType,
        packageDetails: {
          price: req.body.price || package.price,
          viewThreshold: package.viewThreshold,
          commissionRate: package.commissionRate
        }
      });

      await newVideo.save();
       // Push video ID to vendor's uploadedContent
      //  await Vendor.findByIdAndUpdate(vendorId, {
      //   $push: { uploadedContent: newVideo._id }
      // });


      const populatedVideo = await Video.findById(newVideo._id)
        .populate('type_id', 'name')
        .populate('category_id', 'name')
        .populate('cast_id', 'name')
        .populate('language_id', 'name')
        .populate('producer_id', 'name')
        .populate('channel_id', 'name')
        .populate('vendor_id', 'name');

      res.status(201).json({
        success: true,
        message: 'Video created successfully',
        video: populatedVideo
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Video creation failed', error: err.message });
    }
  }
);
// update the videos 
router.put(
  '/update-video/:videoId', 
  isVendor,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'landscape', maxCount: 1 },
    { name: 'video_320', maxCount: 1 },
    { name: 'video_480', maxCount: 1 },
    { name: 'video_720', maxCount: 1 },
    { name: 'video_1080', maxCount: 1 },
    { name: 'trailer', maxCount: 1 }
  ]), 
  async (req, res) => {
    try {
      const videoId = req.params.videoId;
      const vendorId = req.vendor.id;

      // Find the video by its ID and ensure the vendor owns it
      const video = await Video.findById(videoId);
      if (!video || video.vendor_id.toString() !== vendorId) {
        return res.status(403).json({ success: false, message: 'You do not have permission to update this video.' });
      }

      // Optionally update files
      let thumbnailUrl = video.thumbnail, 
          landscapeUrl = video.landscape, 
          video_320Url = video.video_320, 
          video_480Url = video.video_480, 
          video_720Url = video.video_720, 
          video_1080Url = video.video_1080, 
          trailerUrl = video.trailer_url;

      const uploadFile = async (field, folder, currentUrl) => {
        if (req.files[field]) {
          const file = req.files[field][0];
          const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          const uploadedUrl = await uploadToCloudinary(base64, folder, file.mimetype);
          return uploadedUrl || currentUrl;
        }
        return currentUrl;
      };

      thumbnailUrl = await uploadFile('thumbnail', 'videos/thumbnails', thumbnailUrl);
      landscapeUrl = await uploadFile('landscape', 'videos/landscapes', landscapeUrl);
      video_320Url = await uploadFile('video_320', 'videos/320', video_320Url);
      video_480Url = await uploadFile('video_480', 'videos/480', video_480Url);
      video_720Url = await uploadFile('video_720', 'videos/720', video_720Url);
      video_1080Url = await uploadFile('video_1080', 'videos/1080', video_1080Url);
      trailerUrl = await uploadFile('trailer', 'videos/trailers', trailerUrl);

      const { 
        name, description, video_upload_type, video_extension, 
        video_duration, trailer_type, subtitle_type, subtitle_lang_1, 
        subtitle_1, subtitle_lang_2, subtitle_2, subtitle_lang_3, 
        subtitle_3, release_date, is_premium, is_title, is_download, 
        is_like, is_comment, total_like, total_view, is_rent, price, 
        rent_day, status, monetizationType
      } = req.body;

      // Update video metadata
      video.name = name || video.name;
      video.description = description || video.description;
      video.video_upload_type = video_upload_type || video.video_upload_type;
      video.video_extension = video_extension || video.video_extension;
      video.video_duration = video_duration || video.video_duration;
      video.trailer_type = trailer_type || video.trailer_type;
      video.subtitle_type = subtitle_type || video.subtitle_type;
      video.subtitle_lang_1 = subtitle_lang_1 || video.subtitle_lang_1;
      video.subtitle_1 = subtitle_1 || video.subtitle_1;
      video.subtitle_lang_2 = subtitle_lang_2 || video.subtitle_lang_2;
      video.subtitle_2 = subtitle_2 || video.subtitle_2;
      video.subtitle_lang_3 = subtitle_lang_3 || video.subtitle_lang_3;
      video.subtitle_3 = subtitle_3 || video.subtitle_3;
      video.release_date = release_date || video.release_date;
      video.is_premium = is_premium || video.is_premium;
      video.is_title = is_title || video.is_title;
      video.is_download = is_download || video.is_download;
      video.is_like = is_like || video.is_like;
      video.is_comment = is_comment || video.is_comment;
      video.total_like = total_like || video.total_like;
      video.total_view = total_view || video.total_view;
      video.is_rent = is_rent || video.is_rent;
      video.price = price || video.price;
      video.rent_day = rent_day || video.rent_day;
      video.status = status || video.status;
      video.monetizationType = monetizationType || video.monetizationType;
      
      video.thumbnail = thumbnailUrl;
      video.landscape = landscapeUrl;
      video.video_320 = video_320Url;
      video.video_480 = video_480Url;
      video.video_720 = video_720Url;
      video.video_1080 = video_1080Url;
      video.trailer_url = trailerUrl;

      await video.save();

      const populatedVideo = await Video.findById(video._id)
        .populate('type_id', 'name')
        .populate('category_id', 'name')
        .populate('cast_id', 'name')
        .populate('language_id', 'name')
        .populate('producer_id', 'name')
        .populate('channel_id', 'name')
        .populate('vendor_id', 'name');

      res.status(200).json({
        success: true,
        message: 'Video updated successfully',
        video: populatedVideo
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Video update failed', error: err.message });
    }
  }
);
//get all the  videos 
router.get('/videos', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor?._id || req.user?._id;

    const videos = await Video.find({ vendor_id: vendorId }).populate('category_id', 'name');

    res.status(200).json({
      message: 'Fetched videos for the vendor successfully',
      videos
    });
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
//videos by category
router.get('/videos/category/:categoryId', async (req, res) => {
  try {
    const videos = await Video.find({ category_id: req.params.categoryId })
    console.log("", videos);
      // .populate('category', 'name')
      // .sort({ createdAt: -1 });

    res.status(200).json({ message: 'Videos by category fetched successfully', videos });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
//get videos by type
router.get('/videos/type/:typeId', async (req, res) => {
  try {
    const videos = await Video.find({ type_id : req.params.typeId })
   

    res.status(200).json({ message: 'Videos by type fetched successfully', videos });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// get video by specific id 
router.get('/videos/:id', isVendor, async (req, res) => {
  try {
    const videoId = req.params.id;
    const vendorId = req.vendor.id;
    
    const video = await Video.findOne({ 
      _id: videoId, 
      vendor_id: vendorId 
    }).populate('package_id');
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found or not authorized'
      });
    }
    
    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving video details',
      error: error.message
    });
  }
});
// ✅ POST - Add a new package
router.post('/packages', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor._id; // Vendor ID from the token
    
    const {
      name,
      description,
      revenueType,
      viewThreshold,
      commissionRate,
      price,
      rentalDuration,
    } = req.body;

    // Validate required fields
    if (!name || !revenueType || commissionRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, revenueType, and commissionRate are required.',
      });
    }

    // If the revenueType is "rental", ensure price and rentalDuration are provided
    // If it's a rental package, validate against admin-defined limit
    if (revenueType === 'rental') {
      const rentalLimit = await RentalLimit.findOne().sort({ createdAt: -1 }); // Get the latest limit
      if (!rentalLimit) {
        return res.status(500).json({
          success: false,
          message: 'Rental limit not set by admin.',
        });
      }

      if (price >= rentalLimit.maxRentalPrice) {
        return res.status(400).json({
          success: false,
          message: `Rental price must be less than ${rentalLimit.maxRentalPrice}`,
        });
      }
    }


    // Create the new package
    const newPackage = new Package({
      name,
      description,
      revenueType,
      viewThreshold,
      commissionRate,
      price,
      rentalDuration,
      vendor_id: vendorId, // Linking the package to the vendor
    });

    await newPackage.save();

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: newPackage,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
// ✅ GET - Get all unique packages used by the logged-in vendor
router.get('/vendor-packages', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor._id; // Vendor ID from token (set in isVendor middleware)

    // Fetch all packages created by this vendor
    const packages = await Package.find({ vendor_id: vendorId });

    res.status(200).json({
      success: true,
      data: packages,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
// assign the package according to the vendor 
router.post('/assign-package', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { videoId, revenueType, packageId } = req.body;

    // Basic validation
    if (!videoId || !revenueType) {
      return res.status(400).json({
        success: false,
        message: 'videoId and revenueType are required.',
      });
    }

    // If rental, validate packageId and price
    let selectedPackage = null;
    if (revenueType === 'rental') {
      if (!packageId) {
        return res.status(400).json({
          success: false,
          message: 'Rental revenueType requires a packageId.',
        });
      }

      selectedPackage = await Package.findOne({ _id: packageId, vendor_id: vendorId, revenueType: 'rental' });
      if (!selectedPackage) {
        return res.status(404).json({
          success: false,
          message: 'Rental package not found or unauthorized.',
        });
      }
    }

    // Update the video
    const updateData = {
      monetizationType: revenueType,
      package_id: packageId || null,
      packageType: revenueType,
      packageDetails: selectedPackage ? {
        price: selectedPackage.price,
        viewThreshold: selectedPackage.viewThreshold,
        commissionRate: selectedPackage.commissionRate
      } : undefined
    };

    const updatedVideo = await Video.findOneAndUpdate(
      { _id: videoId, vendor_id: vendorId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedVideo) {
      return res.status(404).json({
        success: false,
        message: 'Video not found or unauthorized.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Package and monetization type assigned successfully.',
      data: updatedVideo,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
// total videos vendor have uploaded 
router.get('/video-count', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor._id // Get vendorId from the decoded token
    console.log("id", vendorId);
    console.log("Vendor ID: ", vendorId);  // Debugging output

    if (!vendorId) {
      return res.status(400).json({ message: 'Vendor I D is required.' });
    }

    // Query to count how many videos are uploaded by the vendor
    const videoCount = await Video.countDocuments({ vendor_id: new mongoose.Types.ObjectId(vendorId) });
    console.log("Video Count: ", videoCount); // Debugging output

    if (videoCount === 0) {
      return res.status(404).json({ message: 'No videos found for this vendor.' });
    }

    res.json({ videoCount });
  } catch (error) {
    console.error('Error fetching video count for vendor:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// Get views for a specific video by the vendor
router.get('/video-views/:videoId', isVendor, async (req, res) => {
  try {
    const { videoId } = req.params;
    const vendorId = req.vendor._id // Get vendorId from the decoded token

    // Check if the video belongs to this vendor
    const video = await Video.findOne({
      _id: videoId,
      vendor_id: vendorId
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found or not authorized.' });
    }

    res.status(200).json({
      videoId: video._id,
      name: video.name,
      total_view: video.total_view,
      viewCount: video.viewCount,
      adViews: video.adViews
    });

  } catch (error) {
    console.error('Error fetching video views:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// get the total views of the vendor 
router.get('/total-views', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendorId;

    const videos = await Video.find({ vendor_id: vendorId });

    let totalViews = 0;
    let totalViewCount = 0;
    let totalAdViews = 0;

    videos.forEach(video => {
      totalViews += video.total_view || 0;
      totalViewCount += video.viewCount || 0;
      totalAdViews += video.adViews || 0;
    });

    res.status(200).json({
      vendorId,
      totalViews,
      totalViewCount,
      totalAdViews,
      totalVideos: videos.length
    });

  } catch (error) {
    console.error('Error fetching vendor total views:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// total likes 
router.get('/vendor-total-likes', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor._id; 

    const result = await Video.aggregate([
      {
        $match: {
          vendor_id: new mongoose.Types.ObjectId(vendorId)
        }
      },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: "$total_like" }
        }
      }
    ]);

    const totalLikes = result.length > 0 ? result[0].totalLikes : 0;

    res.status(200).json({
      vendorId,
      totalLikes
    });

  } catch (error) {
    console.error('Error fetching total likes:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// GET /vendor-total-earnings
router.get('/vendor-total-earnings', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor._id;

    const result = await Video.aggregate([
      {
        $match: {
          vendor_id: new mongoose.Types.ObjectId(vendorId)
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$totalEarnings" }
        }
      }
    ]);

    const totalEarnings = result.length > 0 ? result[0].totalEarnings : 0;

    res.status(200).json({
      vendorId,
      totalEarnings
    });

  } catch (error) {
    console.error('Error fetching total earnings:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// GET /pending-approvals
router.get('/pending-approvals', isVendor, async (req, res) => {
  try {
    const pendingVideos = await Video.find({ isApproved: false }).populate('vendor_id', 'name email');

    res.status(200).json({
      count: pendingVideos.length,
      pendingVideos
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// DELETE route to delete a video
router.delete('/delete-video/:videoId', isVendor, async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const vendorId = req.vendor.id;

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found.' });
    }

    if (video.vendor_id.toString() !== vendorId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this video.' });
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json({ success: true, message: 'Video deleted successfully.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to delete video.', error: err.message });
  }
});
// GET: Get all videos of the vendor with approval status
router.get('/approved-videos', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id;

    const videos = await Video.find({ vendor_id: vendorId }).select('name isApproved approvalNote approvalDate createdAt updatedAt');

    return res.status(200).json({
      success: true,
      videos
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
