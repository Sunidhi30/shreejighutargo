const express = require('express');
const Admin = require("../models/Admin");
const router = express.Router();
const multer = require('multer');
const RentalLimit = require("../models/RentalLimit");
const cloudinary = require('cloudinary').v2;
const { uploadToCloudinary } = require("../utils/cloudinary");
const Movie = require('../models/Movie');
const Vendors = require("../models/Vendor");
const storage = multer.memoryStorage();
const Setting = require("../models/LikesSetting");
// const Package = require("../models/Package")
const finalPackage = require("../models/FinalPackage");
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
    // console.log(req.body)

    try {
      
      const { 
        type_id, video_type,channel_id, producer_id, category_id,finalPackage_id,
        language_id, cast_id, name, description, video_upload_type, video_extension,
        video_duration, trailer_type, subtitle_type, subtitle_lang_1, subtitle_1,
        subtitle_lang_2, subtitle_2, subtitle_lang_3, subtitle_3, release_date, is_premium,
        is_title, is_download, is_like, is_comment, total_like, total_view, is_rent, price,
        rent_day
      } = req.body;
      const vendorId = req.vendor.id;
      // console.log("", vendorId);
      // console.log(req.body)
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
        finalPackage_id: finalPackage_id ? new mongoose.Types.ObjectId(finalPackage_id) : null,
        cast_id: cast_id ? new mongoose.Types.ObjectId(cast_id) : null,
        name,
        // monetizationType,
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
        isApproved: false
        // packageType: package.revenueType,
        // packageDetails: {
        //   price: req.body.price || package.price,
        //   viewThreshold: package.viewThreshold,
        //   commissionRate: package.commissionRate
        // }
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
        .populate('vendor_id', 'name')
        .populate('finalPackage_id',name);

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
    const vendorId = req.vendor?._id
    console.log("venodrs "+vendorId) 

    const videos = await Video.find({ vendor_id: vendorId })
    // .populate('category_id', 'name') 
    // .populate('finalPackage_id', 'name') // Populating only the 'name' field of the FinalPackage model
    .populate('category_id', 'name')
    .populate('finalPackage_id', 'name')
    .populate('finalPackage_id', 'price');
    console.log(videos);
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
    console.log("videos is this ", videos);
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
//packages
router.post('/create-packages', isVendor, async (req, res) => {
  const vendor_id = req.vendor.id;
  try {
    const {
      name,
      description,
      revenueType,
      viewThreshold,
    
      price,
      rentalDuration,
      customDetails
    } = req.body;

    // Validate if all required fields are provided
    if (!name || !revenueType  || !price) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Fetch the vendor to ensure they exist
    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    // Fetch the latest rental limit from RentalLimit model
    const rentalLimit = await RentalLimit.findOne().sort({ createdAt: -1 });
    if (!rentalLimit) return res.status(500).json({ message: 'Rental limit not set by admin' });

    // Ensure the price is within the rental limit
    if (price > rentalLimit.maxRentalPrice) {
      return res.status(400).json({ message: `Price cannot exceed max rental price (${rentalLimit.maxRentalPrice})` });
    }

    // Create the new package with the fixed commission rate and rental price validation
    const newPackage = new finalPackage({
      name,
      description,
      revenueType,
      viewThreshold: viewThreshold || 30,  // Default to 30 if not provided
      vendor_id,
      price,
      rentalDuration: rentalDuration || 48, // Default to 48 hours if not provided
      status: true, // Default to true, assuming active
      customDetails: customDetails || [], // Default to empty array if not provided
      commissionRate: 40 // Fixed commission rate
    });

    // Save the package
    const savedPackage = await newPackage.save();
    res.status(201).json(savedPackage);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create package', error: err.message });
  }
});
// Get all packages for a specific vendor
router.get('/get-packages',isVendor, async (req, res) => {
  try {
    const vendor_id = req.vendor.id;
    console.log("vendor id "+" "+vendor_id);
    // Fetch all packages by vendor_id
    const packages = await finalPackage.find({ vendor_id })
      .populate('vendor_id', 'fullName email') // You can populate vendor details if needed
      .sort({ createdAt: -1 }); // Sort packages by creation date, latest first

    if (packages.length === 0) {
      return res.status(404).json({ message: 'No packages found for this vendor' });
    }

    res.status(200).json(packages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch packages', error: err.message });
  }
});
//video count
// router.post('/assign-package', isVendor, async (req, res) => {
//   try {
//     const vendorId = req.vendor._id;
//     const { videoId, revenueType, packageId } = req.body;

//     // Basic validation
//     if (!videoId || !revenueType) {
//       return res.status(400).json({
//         success: false,
//         message: 'videoId and revenueType are required.',
//       });
//     }

//     // If rental, validate packageId and price
//     let selectedPackage = null;
//     if (revenueType === 'rental') {
//       if (!packageId) {
//         return res.status(400).json({
//           success: false,
//           message: 'Rental revenueType requires a packageId.',
//         });
//       }

//       selectedPackage = await Package.findOne({ _id: packageId, vendor_id: vendorId, revenueType: 'rental' });
//       if (!selectedPackage) {
//         return res.status(404).json({
//           success: false,
//           message: 'Rental package not found or unauthorized.',
//         });
//       }
//     }

//     // Update the video
//     const updateData = {
//       monetizationType: revenueType,
//       package_id: packageId || null,
//       packageType: revenueType,
//       packageDetails: selectedPackage ? {
//         price: selectedPackage.price,
//         viewThreshold: selectedPackage.viewThreshold,
//         commissionRate: selectedPackage.commissionRate
//       } : undefined
//     };

//     const updatedVideo = await Video.findOneAndUpdate(
//       { _id: videoId, vendor_id: vendorId },
//       { $set: updateData },
//       { new: true }
//     );

//     if (!updatedVideo) {
//       return res.status(404).json({
//         success: false,
//         message: 'Video not found or unauthorized.',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Package and monetization type assigned successfully.',
//       data: updatedVideo,
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// });
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
// Route: Calculate vendor and admin earnings based on likes
router.get('/calculate-earnings', isVendor,async (req, res) => {
  const vendorId = req.vendor.id; // Extracted vendorId from the token

  try {
    // Fetch global settings from the database
    const setting = await Setting.findOne();
    if (!setting) {
      return res.status(404).json({ message: 'Earnings settings not found. Please set earnings first.' });
    }

    // Find all videos uploaded by this vendor
    const videos = await Video.find({ vendor_id: vendorId, isApproved: true });

    // Calculate total likes across all videos
    const totalLikes = videos.reduce((acc, video) => acc + (video.total_like || 0), 0);

    // Calculate total earnings based on likes
    const totalEarnings = totalLikes * setting.pricePerLike;

    // Split earnings based on the settings
    const vendorShare = (setting.vendorPercentage / 100) * totalEarnings;
    const adminShare = (setting.adminPercentage / 100) * totalEarnings;

    // Update vendor wallet
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    vendor.wallet += vendorShare;
    await vendor.save();

    // Update admin wallet (assuming single admin)
    const admin = await Admin.findOne();
    if (admin) {
      admin.wallet += adminShare;
      await admin.save();
    }

    res.status(200).json({
      message: 'Earnings calculated successfully',
      vendorWallet: vendor.wallet,
      adminWallet: admin ? admin.wallet : 0,
      totalLikes,
      totalEarnings,
      vendorShare,
      adminShare
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating earnings', error: error.message });
  }
});
// Route to get vendor earnings this is the wrong api 
router.get('/vendor/earnings',isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id

    // Fetch all APPROVED videos uploaded by this vendor
    const videos = await Video.find({ vendor_id: vendorId, isApproved: true });

    let totalEarnings = 0;
    let detailedEarnings = [];

    videos.forEach(video => {
      let videoEarnings = 0;

      if (video.monetizationType === 'rental' && video.price) {
        // Earnings from rentals
        videoEarnings = video.total_view * video.price;
      } 
      else if (video.monetizationType === 'view') {
        // Earnings from views (let's assume $0.01 per view if not specified)
        videoEarnings = video.viewCount * 0.01;
      } 
      else if (video.monetizationType === 'ad') {
        // Earnings from ad views (let's assume $0.005 per ad view if not specified)
        videoEarnings = video.adViews * 0.005;
      }

      totalEarnings += videoEarnings;
      console.log("total earnings", totalEarnings);

      detailedEarnings.push({
        videoId: video._id,
        name: video.name,
        monetizationType: video.monetizationType,
        earnings: videoEarnings.toFixed(2)
      });
    });

    // Update the vendor's wallet (optional, if you want real-time update)
    await Vendor.findByIdAndUpdate(vendorId, { wallet: totalEarnings });

    res.status(200).json({
      success: true,
      vendorId,
      totalEarnings: totalEarnings.toFixed(2),
      videos: detailedEarnings
    });
  } catch (error) {
    console.error('Error fetching vendor earnings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// Search Vendor's Uploaded Videos
router.get('/vendor/videos/search', async (req, res) => {
  try {
    const { name, category } = req.query;

    // Check if both name and category are missing
    if (!name && !category) {
      return res.status(400).json({ message: 'Please provide at least a name or category to search.' });
    }

    // Build search filter
    const filter = {};
    if (name) {
      filter.name = { $regex: name, $options: 'i' }; // case-insensitive partial match
    }
    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    // Find videos matching the filters
    const videos = await Video.find(filter);

    // Check if videos exist
    if (videos.length === 0) {
      return res.status(404).json({ message: 'No videos found matching the search criteria.' });
    }

    res.status(200).json({
      message: 'Videos fetched successfully',
      videos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});
// get the videos acc to monetization(rental,views,ads)
router.get('/users-count', async (req, res) => {
  try {
    const count = await User.countDocuments({ deleted: false });
    res.status(200).json({ totalUsers: count });
  } catch (error) {
    console.error('Error counting users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// GET /api/tvshows/count
router.get('/tvshows-count', async (req, res) => {
  try {
    const count = await TVShow.countDocuments();
    res.status(200).json({ totalTVShows: count });
  } catch (error) {
    console.error('Error counting TV Shows:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// GET /api/channel/count
router.get('/channels-count', async (req, res) => {
  try {
    const count = await Channel.countDocuments();
    res.status(200).json({ ChannelCounts: count });
  } catch (error) {
    console.error('Error counting TV Shows:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// GET /api/cast/count
router.get('/casts-count', async (req, res) => {
  try {
    const count = await Cast.countDocuments();
    res.status(200).json({ CastCounts: count });
  } catch (error) {
    console.error('Error counting TV Shows:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Count videos uploaded by a specific vendor
router.get('/vendor/video-count', isVendor,async (req, res) => {
 
  const vendorId = req.vendor.id
  try {
    const videoCount = await Video.countDocuments({ vendor_id: vendorId });

    res.status(200).json({
      success: true,
      vendorId,
      videoCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving video count',
      error: error.message
    });
  }
});
// GET: All videos uploaded by a specific vendor
router.get('/vendor/videos', isVendor, async (req, res) => {
  const vendorId = req.vendor.id;

  try {
    const videos = await Video.find({ vendor_id: vendorId });

    res.status(200).json({
      success: true,
      vendorId,
      videos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving vendor videos',
      error: error.message
    });
  }
});
router.get('/videos-by-status', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { status } = req.query; // 'pending', 'approved', or 'rejected'

    // Initialize the query to search for the vendor's videos
    const query = { vendor_id: vendorId };

    // If a status is provided, add it to the query
    if (status) {
      query.status = status;
    }

    // Fetch the videos with the required fields
    const videos = await Video.find(query).select(
      'name thumbnail video_type status finalPackage_id' // Add 'finalPackage_id' to query
    );

    // For each video, retrieve the associated price from the final package
    for (let video of videos) {
      // Assuming you have a FinalPackage model to get the package details
      const package = await finalPackage.findById(video.finalPackage_id);

      // If the package is found, add the price to the video
      if (package) {
        video.price = package.price;
      } else {
        video.price = 0; // Default price if no package is found
      }
    }

    // Return the response with the video data including the price
    return res.status(200).json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
});
router.get('/top-performing-videos', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    console.log("vendor id ", vendorId);
    // Find approved videos for this vendor, sorted by total likes
    const videos = await Video.find({ vendor_id: vendorId, status: "approved" })
      .sort({ total_like: -1 })
      .limit(10)
      .select('name thumbnail video_type total_like finalPackage_id');

    // Populate price from final package
    for (let video of videos) {
      const pkg = await finalPackage.findById(video.finalPackage_id);
      video.price = pkg ? pkg.price : 0;
    }

    return res.status(200).json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error('Error fetching top-performing videos:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
});
// GET vendor earnings using token
router.get('/vendor-earnings', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    console.log("vendor.totalViews:", vendor.totalViews);
    const admin = await Admin.findOne();
    console.log("admin", admin);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const earnings = vendor.totalViews * admin.pricePerView;
    console.log("earningis :", earnings);
    res.json({
      success: true,
      vendorId: vendor._id,
      totalViews: vendor.totalViews,
      pricePerView: admin.pricePerView,
      earnings
    });
  } catch (error) {
    console.error('Error fetching vendor earnings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
module.exports = router;
