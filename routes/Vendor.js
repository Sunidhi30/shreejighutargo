const express = require('express');
const router = express.Router();
const multer = require('multer');
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
const bcrypt = require('bcrypt');
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
//upload video 
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
        rent_day, status
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
        status: Number(status),
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
//get all the  videos 
router.get('/videos', async (req, res) => {
  try {
    // const videos = await Video.find();
    const videos = await Video.find().populate('category_id', 'name'); // only fetch name

   
    res.status(200).json({
      message: 'Fetched all videos successfully',
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
// add packages and the send the request to theadmin
// router.post('/vendor/package-request', isVendor, async (req, res) => {
//   try {
//     const { package_id, details } = req.body;

//     // 1. Fetch the admin-defined package
//     const adminPackage = await Package.findById(package_id);
//     if (!adminPackage) {
//       return res.status(404).json({
//         success: false,
//         message: 'Package not found'
//       });
//     }

//     // 2. Extract vendor-provided price and rentalDuration from details
//     const vendorValues = {};
//     for (const { key, value } of details) {
//       vendorValues[key] = parseFloat(value); // convert to number if numeric
//     }

//     // 3. Compare with admin-defined limits
//     if (vendorValues.price && vendorValues.price > adminPackage.price) {
//       return res.status(400).json({
//         success: false,
//         message: `Vendor price (${vendorValues.price}) cannot exceed admin-defined limit (${adminPackage.price})`
//       });
//     }

//     if (vendorValues.duration && vendorValues.duration > adminPackage.rentalDuration) {
//       return res.status(400).json({
//         success: false,
//         message: `Vendor duration (${vendorValues.duration}) cannot exceed admin-defined limit (${adminPackage.rentalDuration} hours)`
//       });
//     }

//     // 4. Save valid details
//     const insertedDetails = [];
//     for (const { key, value } of details) {
//       const detail = await PackageDetail.create({
//         package_id,
//         vendor_id: req.vendor.id,
//         package_key: key,
//         package_value: value
//       });
//       insertedDetails.push(detail);
//     }

//     res.status(201).json({
//       success: true,
//       message: 'Package request submitted. Awaiting admin approval.',
//       data: insertedDetails
//     });

//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to submit package details',
//       error: err.message
//     });
//   }
// });
// GET: Approved packages for the logged-in vendor
router.get('/vendor/approved-packages',isVendor, async (req, res) => {

  console.log(req.vendor.id);

  try {
    const approvedPackages = await PackageDetail.find({
      vendor_id: req.vendor.id,
      status: 'approved'
    }).populate('package_id', 'name revenueType price rentalDuration');
     console.log(approvedPackages);
    res.status(200).json({
      success: true,
      data: approvedPackages
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approved packages',
      error: err.message
    });
  }
});
router.post('/vendor/package-request', isVendor, async (req, res) => {
  try {
    const { package_id, details } = req.body;

    const adminPackage = await Package.findById(package_id);
    if (!adminPackage) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Convert array of key-value into object
    const vendorValues = {};
    for (const { key, value } of details) {
      vendorValues[key] = parseFloat(value);
    }

    // Validation: Price and Duration should not exceed admin limits
    if (vendorValues.price && vendorValues.price > adminPackage.price) {
      return res.status(400).json({
        success: false,
        message: `Price (${vendorValues.price}) exceeds admin limit (${adminPackage.price})`
      });
    }

    if (vendorValues.duration && vendorValues.duration > adminPackage.rentalDuration) {
      return res.status(400).json({
        success: false,
        message: `Duration (${vendorValues.duration}) exceeds admin limit (${adminPackage.rentalDuration} hours)`
      });
    }

    // Save Vendor Details
    const insertedDetails = [];
    for (const { key, value } of details) {
      const detail = await PackageDetail.create({
        package_id,
        vendor_id: req.vendor.id,
        package_key: key,
        package_value: value
      });
      insertedDetails.push(detail);
    }

    res.status(201).json({
      success: true,
      message: 'Package request submitted. Awaiting admin approval.',
      data: insertedDetails
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit package details',
      error: err.message
    });
  }
});
router.get('/vendor/approved-packages', isVendor, async (req, res) => {
  try {
    const approvedPackages = await PackageDetail.find({
      vendor_id: req.vendor.id,
      status: 'approved'
    }).populate('package_id', 'name revenueType price rentalDuration');

    res.status(200).json({ success: true, data: approvedPackages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch approved packages', error: err.message });
  }
});

module.exports = router;

