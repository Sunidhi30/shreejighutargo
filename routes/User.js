const express = require('express');
const nodemailer = require("nodemailer");
const { uploadToCloudinary } = require("../utils/cloudinary");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const ContinueWatching = require("../models/ContinueWatching")
const User = require('../models/User');
const ADMIN_EMAIL = "sunidhi@gmail.com";
const cloudinary = require("cloudinary");
const ADMIN_PHONE = "1234567890"; // Optional
const  Language = require("../models/Language");
const SubscriptionPlan= require("../models/SubscriptionPlan");
const ADMIN_OTP = "0000";
const Comment = require('../models/Commet');
const Type =require("../models/Type")
const TvLogin = require('../models/TvLogin');
const { v4: uuidv4 } = require('uuid');
const Avatar = require("../models/Avatar");
const Category = require("../models/Category")
const Subscriptions = require("../models/Subscription");
const Cast = require("../models/Cast");
const JWT_SECRET = process.env.JWT_SECRET || "Apple";
const razorpay = require('../utils/razorpay');
// const { protect,verifyToken } = require('../middleware/auth');
const { protect, isUser } = require("../middleware/auth");
const { body, validationResult } = require('express-validator');
const multer = require("multer");
const storage = multer.memoryStorage();
const  Admin = require("../models/Admin");
const Package = require("../models/Package");
const Transaction = require("../models/Transactions");
const PDFDocument = require("pdfkit");
const upload = multer({ storage: storage });
dotenv.config();
const router = express.Router();
const Video = require("../models/Video");
const fs = require("fs");
const path = require("path");
const Movie = require("../models/Movie");
const Content = require("../models/Content");
const downloadsDir = path.join(__dirname, "../downloads");
const DeviceSync = require("../models/DeviceSync")
const DeviceWatching = require('../models/DeviceWatching');
const crypto = require('crypto');
const axios = require("axios");
default_image_url="https://e7.pngegg.com/pngimages/753/432/png-clipart-user-profile-2018-in-sight-user-conference-expo-business-default-business-angle-service.png"
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true }); // Creates folder if missing
}
const calculateEngagementRate = (video) => {
  const { total_like, total_comment, total_view } = video;

  if (total_view === 0) return 0; // Avoid division by zero

  // A simple engagement rate formula
  return (total_like + total_comment) / total_view * 100;
};
const transporter = nodemailer.createTransport({ 
  service: 'gmail', // Use your email provider
  auth: {
    user: process.env.EMAIL_USER, // Admin email (set in environment variables)
    pass: process.env.EMAIL_PASS // Admin email password (use env variables for security)
  }
});
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Everything Like in the Movies" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for Admin Login',
    text: `Your One-Time Password (OTP) is: ${otp}\nThis OTP is valid for 10 minutes.`,
  };
  await transporter.sendMail(mailOptions);
};

// Helper function to upload to Cloudinary
const uploadingCloudinary = async (base64Data, folder, mimetype) => {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: folder,
      resource_type: 'auto', // This automatically handles image types
    });
    return result.secure_url; // Return the URL of the uploaded image
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

//sign up 
router.post('/signup', async (req, res) => {
  try {
    const { email, device_name, device_type, device_token, device_id } = req.body;

    if (!email || !device_name || !device_type || !device_token || !device_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store session data
    req.session.signupData = {
      email,
      otp,
      otpExpiry,
      device_name,
      device_type,
      device_token,
      device_id
    };

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to email. Please verify to complete signup.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// sign up otp
router.post('/verify-signup-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    const signupData = req.session.signupData;

    if (!signupData) {
      return res.status(400).json({ message: 'Session expired or no OTP request found' });
    }

    if (signupData.otp !== otp || Date.now() > signupData.otpExpiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Save user to DB
    const newUser = new User({ email: signupData.email });
    await newUser.save();

    // Save device info
    const device = new DeviceSync({
      user_id: newUser._id,
      device_name: signupData.device_name,
      device_type: signupData.device_type,
      device_token: signupData.device_token,
      device_id: signupData.device_id,
    });

    await device.save();

    // Clear session
    req.session.signupData = null;

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
async function getCoordinatesFromLocation(location) {
  const apiKey = '420a26521c014c6299ef2a241f068161';
  const res = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${apiKey}`);
  const { lat, lng } = res.data.results[0].geometry;
  return { lat, lng };
}
// Step 1: Login - Send OTP
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'user not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 mins

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending OTP', error: err.message });
  }
});
// Step 2: Verify OTP and Login
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'user not found' });

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP after verification
    user.otp = null;
    user.otpExpiry = null;

    // Capture metadata
    // const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const device = req.headers['user-agent'];
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127')) {
  ip = '8.8.8.8'; // Fallback for local testing
}
    let location = 'Unknown';

    try {
      // Step 1: Get coordinates from IP
      const ipLocationRes = await axios.get(`https://ipapi.co/${ip}/json/`);
      const { latitude, longitude } = ipLocationRes.data;

      // Step 2: Convert coordinates to readable location using OpenCage
      const openCageApiKey = '420a26521c014c6299ef2a241f068161'; // 🔁 Replace with your actual key
      const geoRes = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${openCageApiKey}`);
      
      if (geoRes.data.results && geoRes.data.results.length > 0) {
        location = geoRes.data.results[0].formatted;
      } else {
        location = 'Location not available';
      }
    } catch (geoErr) {
      console.error('Geolocation failed:', geoErr.message);
      location = 'Location fetch failed';
    }

    // Save login info
    user.lastLogin = {
      ip,
      device,
      location,
      time: new Date(),
    };

    await user.save();

    const token = jwt.sign({ userID: user._id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        role: user.role,
        email: user.email,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
  }
});
// get the login information places 
router.get('/api/user/:id/login-info', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('lastLogin email role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
// Get location data for all users
router.get('/user-locations', async (req, res) => {
  try {
    const users = await User.find({}, {
      email: 1,
      'lastLogin.location': 1,
      'lastLogin.coordinates': 1,
      'lastLogin.ip': 1,
      'lastLogin.device': 1,
      'lastLogin.time': 1,
    });

    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user locations', error: err.message });
  }
});
//Generate code from TV
// router.post('/init', async (req, res) => {
//   const code = uuidv4().split('-')[0].toUpperCase(); // Short code like 'A1B2C3'
//   // console.log("code this is ", code);
//   try {
//     const tvLogin = new TvLogin({  unique_code : code });
//     // console.log("tv login ", tvLogin);
//     await tvLogin.save();
//     res.json({ success: true, code });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Failed to initialize login' });
//   }
// });
// POST /tv/init - Initialize TV Login with user_id
router.post('/connect_tv', async (req, res) => {
  const { code, user_id, device_id } = req.body;

  try {
    const tvLogin = await TvLogin.findOne({ unique_code: code, user_id });

    if (!tvLogin) {
      return res.status(400).json({ success: false, message: 'Invalid code or user ID' });
    }

    // If device_token not provided, generate it
    const deviceToken = crypto.randomBytes(16).toString('hex');

    const newDevice = new DeviceSync({
      user_id,
      device_name: 'TV Device',
      device_id,
      device_type: 3,
      device_token: deviceToken,
      tv_login_id: tvLogin._id
    });

    await newDevice.save();

    return res.status(200).json({
      success: true,
      message: 'TV connected successfully',
      device_token: deviceToken // <-- send it back
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to connect TV' });
  }
});
// POST /connect_tv
// router.post('/connect_tv', async (req, res) => {
//   const { code, user_id, device_id, device_token } = req.body;

//   try {
//     const tvLogin = await TvLogin.findOne({ unique_code: code, user_id });

//     if (!tvLogin) {
//       return res.status(400).json({ success: false, message: 'Invalid code or user ID' });
//     }

//     // Sync TV device
//     const deviceToken = crypto.randomBytes(16).toString('hex');
//     const newDevice = new DeviceSync({
//       user_id,
//       device_name: 'TV Device',
//       device_id,
//       device_type: 3, // 3 = TV
//       device_token: deviceToken,
//       tv_login_id: tvLogin._id
//     });

//     await newDevice.save();

//     return res.status(200).json({ success: true, message: 'TV connected successfully' , device_token: deviceToken });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ success: false, message: 'Failed to connect TV' });
//   }
// });
// // 2. Check status from TV (polling)
// router.get('/status/:code', async (req, res) => {
//   try {
//     const tvLogin = await TvLogin.findOne({ unique_code: req.params.code, status: 1 }).populate('user_id');
//     if (!tvLogin) return res.json({ success: true, linked: false });

//     if (tvLogin.user_id) {
//       // User linked account from web/mobile
//       const token = jwt.sign({ id: tvLogin.user_id._id }, process.env.JWT_SECRET);
//       return res.json({ success: true, linked: true, token, user: tvLogin.user_id });
//     }

//     res.json({ success: true, linked: false });
//   } catch (err) {
//     res.status(500).json({ success: false });
//   }
// });

// 3. Link code from web/mobile after login
router.post('/confirm', async (req, res) => {
  const { code, user_id } = req.body;
  if (!code || !user_id) return res.status(400).json({ success: false, message: 'Code and user_id are required' });

  try {
    const tvLogin = await TvLogin.findOneAndUpdate(
      { unique_code: code, status: 1 },
      { user_id },
      { new: true }
    );

    if (!tvLogin) return res.status(404).json({ success: false, message: 'Invalid or expired code' });

    res.json({ success: true, message: 'TV linked successfully' });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
//Logout
router.post('/logout', async (req, res) => {
  const { code } = req.body;
  try {
    await TvLogin.findOneAndUpdate({ unique_code: code }, { status: 0 });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
// Update User Profile Image API
router.put('/upload-profile-image', isUser, upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.user.id;  // Extracted from JWT
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Convert file buffer to base64
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    // Upload image to Cloudinary
    const uploadedImageUrl = await uploadingCloudinary(base64, 'user_profiles', file.mimetype);

    // Update user profile with the new image URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: uploadedImageUrl },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile image updated successfully',
      profileImage: updatedUser.profileImage,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Fetch User Profile API
router.get('/profile', isUser, async (req, res) => {
  try {
    const userId = req.user.id;  // Get the user ID from the JWT token
    console.log("user id "+" "+userId);

    // Fetch user with the correct fields
    const user = await User.findById(userId).select('email profileImage role');  // Select profileImage, not image
    console.log(user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log("user profile image"+" "+user.profileImage)

    res.status(200).json({
      email: user.email,
      profileImage: user.profileImage || 'https://e7.pngegg.com/pngimages/753/432/png-clipart-user-profile-2018-in-sight-user-conference-expo-business-default-business-angle-service.png', // Default image URL if no image is set
      role: user.role
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// approved videos
router.get('/approved-movies', async (req, res) => {
    try {
      const movies = await Video.find({ isApproved: true });
      res.json(movies);
    } catch (error) {
      res.status(500).json({  message: ' failed', error: error.message  });
    }
});
// GET /search-movies?title=someText
router.get('/search-movies', async (req, res) => {
  const { title } = req.query;

  try {
    if (!title) {
      return res.status(400).json({ message: 'Title query is required.' });
    }

    const movies = await Video.find({
      name: { $regex: title, $options: 'i' },
      isApproved: true // Only approved videos
    });

    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});
// parent control check password
router.post('/parent_control_check_password', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User exists' });

  } catch (err) {
    console.error('Error in parent control check:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// POST /get_device_sync_list
// router.post('/get_device_sync_list', async (req, res) => {
//   const { user_id } = req.body;

//   if (!user_id) {
//     return res.status(400).json({
//       success: false,
//       message: 'user_id is required',
//     });
//   }
//   try {
//     const devices = await DeviceSync.find({ user_id, status: 1 }).sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       data: devices,
//     });
//   } catch (error) {
//     console.error('Error fetching device sync list:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Something went wrong',
//     });
//   }
// });
router.post('/get_device_sync_list', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: 'user_id is required',
    });
  }

  try {
    const devices = await DeviceSync.find({ user_id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: devices,
    });
  } catch (error) {
    console.error('Error fetching device sync list:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
});
// Logout Device Sync
router.post('/logout_device_sync', async (req, res) => {
  const { child_user_id } = req.body;
   console.log("child user id ", child_user_id);
  if (!child_user_id) {
    return res.status(400).json({
      success: false,
      message: 'child_user_id is required.',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(child_user_id)) {
    return res.status(400).json({ success: false, message: 'Invalid child_user_id format.' });
  }

  try {
    const device = await DeviceSync.findOne({
      _id: new mongoose.Types.ObjectId(child_user_id),
      status: 1
    });

    console.log("Found device:", device);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found or already logged out.',
      });
    }

    device.status = 0;
    await device.save();

    return res.status(200).json({
      success: true,
      message: 'Device logged out successfully.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: error.message,
    });
  }
});
// Remove the user from login
router.post('/add_remove_device_watching', async (req, res) => {
  try {
    const { user_id, device_id, device_name = 'Unknown Device', device_token } = req.body;

    if (!user_id || !device_id) {
      return res.status(400).json({ message: 'Missing user_id or device_id' });
    }

    // 🔍 Detect device type
    let device_type = 0;
    const lowerDeviceId = device_id.toLowerCase();
    if (lowerDeviceId.includes("android")) device_type = 1;
    else if (lowerDeviceId.includes("ios") || lowerDeviceId.includes("iphone")) device_type = 2;

    const existingDevice = await DeviceSync.findOne({ user_id, device_id });

    if (!existingDevice) {
      // ➕ Add new device
      const deviceData = {
        user_id,
        device_id,
        device_name,
        device_type,
        status: 1,
        ...(device_token && { device_token }) // Only add if present
      };

      const newDevice = new DeviceSync(deviceData);
      await newDevice.save();

      return res.status(200).json({
        message: 'Device added successfully',
        data: newDevice
      });
    } else {
      // ❌ Remove device (Logout)
      await DeviceSync.deleteOne({ user_id, device_id });

      return res.status(200).json({
        message: 'Device removed successfully (User logged out)'
      });
    }

  } catch (error) {
    console.error('Error in add_remove_device_watching:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
// get avatar
router.get('/get_avatar', async (req, res) => {
  try {
    const avatars = await Avatar.find({ status: 1 }); // Only active avatars
    return res.status(200).json(avatars);
  } catch (error) {
    console.error('Error fetching avatars:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
// GET /get_all_types movies , show ?
router.get('/get_all_types', async (req, res) => {
  try {
    const types = await Type.find();

    return res.status(200).json({
      message: 'All types fetched successfully',
      data: types
    });
  } catch (error) {
    console.error('Error fetching types:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
//get types  same as above
router.get('/get_types', async (req, res) => {
  try {
    const types = await Type.find().sort({ name: 1 }); // sort by name if needed

    return res.status(200).json({
      message: 'Types fetched successfully',
      data: types
    });
  } catch (error) {
    console.error('Error fetching types:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
// get category action , romance 
router.get('/get_categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }); // you can sort as needed

    return res.status(200).json({
      message: 'Categories fetched successfully',
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});
// get language  
router.get('/get_languages', async (req, res) => {
  try {
    // Get all languages sorted by name
    const languages = await Language.find().sort({ name: 1 });

    // For each language, get its related videos
    const results = await Promise.all(
      languages.map(async (language) => {
        const videos = await Video.find({ language_id: language._id, isApproved: true })
                                  .select('name thumbnail video_720 status'); // select only needed fields
        return {
          _id: language._id,
          name: language.name,
          image: language.image,
          status: language.status,
          videos
        };
      })
    );

    return res.status(200).json({
      message: 'Languages with videos fetched successfully',
      data: results
    });
  } catch (error) {
    console.error('Error fetching languages with videos:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});
// get cast
router.get('/get_cast', async (req, res) => {
  try {
    const languages = await Cast.find().sort({ name: 1 }); // Optional sorting by name

    return res.status(200).json({
      message: 'Cast fetched successfully',
      data: languages
    });
  } catch (error) {
    console.error('Error fetching Cast:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});
// do the investments in particular plan 
router.post('/invest-plan', async (req, res) => {
  const { userId, packageId } = req.body;

  try {
    // Find user and package
    const user = await User.findById(userId);
    const selectedPackage = await Package.findById(packageId);

    if (!user || !selectedPackage) {
      return res.status(404).json({ message: 'User or Package not found' });
    }

    // Create a transaction for the investment
    const transaction = new Transaction({
      unique_id: `txn_${Date.now()}`,
      user_id: userId,
      package_id: packageId,
      transaction_id: `txn_${Date.now()}`,
      price: selectedPackage.price.toString(),
      status: 1,  // Successful status
      amount: selectedPackage.price,
      payment_status: 'completed'
    });

    await transaction.save();

    // Add the transaction to user's profile
    user.transactions.push(transaction._id);
    await user.save();

    // Update admin's wallet (add investment amount)
    const admin = await Admin.findOne();
    if (admin) {
      admin.wallet += selectedPackage.price;
      await admin.save();
    }

    res.status(200).json({ message: 'Investment successful', transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// GET /api/users/:id - Get user details by ID including email
// router.get('/:id', async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id)
//       .select('-otp -otpExpiry') // exclude sensitive fields if needed
//       .populate('watchlist')
//       .populate('downloads')
//       .populate('subscriptions')
//       .populate('rentedVideos')
//       .populate('transactions');

//     if (!user || user.deleted) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Email will be included automatically
//     res.status(200).json(user);
//   } catch (err) {
//     console.error('Error fetching user:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
// Get all active subscription plans (for users to view)
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true });
    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans',
      error: error.message
    });
  }
});
// user subscribing to the plan
// Subscribe to a plan
router.post('/subscribe', isUser, async (req, res) => {
  try {
    const { planId, paymentMethod, paymentId } = req.body;
    
    // Find the plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found or inactive'
      });
    }
    
    // Calculate end date based on plan duration
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (plan.durationType === 'day') {
      endDate.setDate(endDate.getDate() + plan.duration);
    } else if (plan.durationType === 'month') {
      endDate.setMonth(endDate.getMonth() + plan.duration);
    } else if (plan.durationType === 'year') {
      endDate.setFullYear(endDate.getFullYear() + plan.duration);
    }
    
    // Create a transaction record
    const transaction = new Transaction({
      user: req.user._id,
      amount: plan.price,
      paymentMethod,
      paymentId,
      status: 'completed', // Assuming payment is already processed
      type: 'subscription',
      itemReference: plan._id,
      itemModel: 'SubscriptionPlan'
    });
    
    await transaction.save();
    
    // Create the subscription
    const subscription = new UserSubscription({
      user: req.user._id,
      plan: plan._id,
      startDate,
      endDate,
      paymentMethod,
      paymentId,
      transactionId: transaction._id
    });
    
    await subscription.save();
    
    // Update the user's subscriptions array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { subscriptions: subscription._id, transactions: transaction._id } }
    );
    
    // Update admin's wallet with the subscription amount
    const planCreator = await Admin.findById(plan.createdBy);
    if (planCreator) {
      planCreator.wallet += plan.price;
      await planCreator.save();
    }
    
    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to the plan',
      data: {
        subscription,
        expiresAt: endDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error subscribing to plan',
      error: error.message
    });
  }
});
// create the subscription 
router.post('/create-order', async (req, res) => {
  const { planId, userId, paymentMethod } = req.body;

  try {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const options = {
      amount: plan.price * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${new Date().getTime()}`,
    };

    const order = await razorpay.orders.create(options);

    // Create transaction
    const transaction = await Transaction.create({
      user: userId,
      amount: plan.price,
      paymentMethod,
      paymentId: order.id,
      status: 'pending',
      type: 'subscription',
      itemReference: planId,
      itemModel: 'SubscriptionPlan',
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: options.amount,
      currency: options.currency,
      transactionId: transaction._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
});
router.post('/verify-payment', async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    transactionId,
    userId,
    planId
  } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    const plan = await SubscriptionPlan.findById(planId);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    // Update transaction
    await Transaction.findByIdAndUpdate(transactionId, {
      status: 'completed',
      paymentId: razorpay_payment_id,
    });

    // Create user subscription
    await UserSubscription.create({
      user: userId,
      plan: planId,
      endDate,
      paymentMethod: 'razorpay',
      paymentId: razorpay_payment_id,
      transactionId
    });

    return res.json({ success: true, message: 'Payment verified and subscription activated' });
  } else {
    await Transaction.findByIdAndUpdate(transactionId, {
      status: 'failed',
    });
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }
});
// Get current user's active subscription
router.get('/my-subscription', isUser, async (req, res) => {
  try {
    const subscription = await UserSubscription.findOne({
      user: req.user._id,
      status: 'active'
    }).populate('plan');
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
      error: error.message
    });
  }
});
// Upgrade or change subscription plan
router.post('/change-plan', isUser, async (req, res) => {
  try {
    const { planId, paymentMethod, paymentId } = req.body;
    
    // Find current subscription
    const currentSubscription = await UserSubscription.findOne({
      user: req.user._id,
      status: 'active'
    });
    
    // Find the new plan
    const newPlan = await SubscriptionPlan.findById(planId);
    if (!newPlan || !newPlan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found or inactive'
      });
    }
    
    // If user has an active subscription, cancel it
    if (currentSubscription) {
      currentSubscription.status = 'canceled';
      await currentSubscription.save();
    }
    
    // Calculate end date based on plan duration
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (newPlan.durationType === 'day') {
      endDate.setDate(endDate.getDate() + newPlan.duration);
    } else if (newPlan.durationType === 'month') {
      endDate.setMonth(endDate.getMonth() + newPlan.duration);
    } else if (newPlan.durationType === 'year') {
      endDate.setFullYear(endDate.getFullYear() + newPlan.duration);
    }
    
    // Create a transaction record
    const transaction = new Transaction({
      user: req.user._id,
      amount: newPlan.price,
      paymentMethod,
      paymentId,
      status: 'completed',
      type: 'subscription',
      itemReference: newPlan._id,
      itemModel: 'SubscriptionPlan'
    });
    
    await transaction.save();
    
    // Create the new subscription
    const subscription = new UserSubscription({
      user: req.user._id,
      plan: newPlan._id,
      startDate,
      endDate,
      paymentMethod,
      paymentId,
      transactionId: transaction._id
    });
    
    await subscription.save();
    
    // Update the user's subscriptions array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { subscriptions: subscription._id, transactions: transaction._id } }
    );
    
    // Update admin's wallet
    const planCreator = await Admin.findById(newPlan.createdBy);
    if (planCreator) {
      planCreator.wallet += newPlan.price;
      await planCreator.save();
    }
    
    res.status(201).json({
      success: true,
      message: 'Successfully changed subscription plan',
      data: {
        subscription,
        expiresAt: endDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing subscription plan',
      error: error.message
    });
  }
});
// Get subscription history
router.get('/subscription-history', isUser, async (req, res) => {
  try {
    const subscriptions = await UserSubscription.find({
      user: req.user._id
    }).populate('plan').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription history',
      error: error.message
    });
  }
});
// Cancel subscription (turn off auto-renewal)
router.patch('/cancel-subscription', isUser, async (req, res) => {
  try {
    const subscription = await UserSubscription.findOne({
      user: req.user._id,
      status: 'active'
    });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    
    subscription.autoRenew = false;
    await subscription.save();
    
    res.status(200).json({
      success: true,
      message: 'Auto-renewal turned off. Your subscription will expire on the end date.',
      data: {
        subscription,
        expiresAt: subscription.endDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error canceling subscription',
      error: error.message
    });
  }
});
// POST /api/comments
router.post('/comment',isUser, async (req, res) => {
  try {
    const {
  
      video_id,
      comment
    } = req.body;

    if (!comment || !video_id) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const newComment = new Comment({
      user_id: req.user._id, // from isAuthenticated middleware
      
      video_id,
    
      comment
    });

    const savedComment = await newComment.save();
    return res.status(201).json({ message: 'Comment posted', comment: savedComment });

  } catch (error) {
    console.error('Comment post error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// 👉 Like a video
router.patch('/:videoId/like', async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findByIdAndUpdate(
      videoId,
      { $inc: { total_like: 1 } },
      { new: true }
    );
     // Increment the like count
     video.total_like += 1;

     // Optionally, you can calculate the engagement rate after updating like count
     video.engagementRate = calculateEngagementRate(video); // Implement this function as needed
     await video.save();


    if (!video) return res.status(404).json({ message: 'Video not found' });

    res.json({ message: 'Video liked', total_like: video.total_like });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong while liking the video.' });
  }
});
// 💬 Comment on a video
// Add comment using token
router.post('/:videoId/comment', isUser, async (req, res) => {
  try {
    const { comment } = req.body;
    const { videoId } = req.params;
    const user_id = req.user._id;

    if (!comment) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const newComment = new Comment({
      video_id: videoId,
      user_id,
      comment,
    });

    await newComment.save();
    // / Find the video and increment the total comments count
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.total_comment += 1;
    // Optionally, recalculate the engagement rate
    video.engagementRate = calculateEngagementRate(video);

    await video.save();

    res.status(201).json({ message: 'Comment added successfully', comment: newComment });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment', details: err.message });
  }
});
router.post('/:videoId/view', async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Increment the view count
    video.total_view += 1;

    // Optionally, you can calculate engagement rate based on views, likes, and comments here.
    video.engagementRate = calculateEngagementRate(video); // Implement this function as needed

    await video.save();
    res.status(200).json({ message: 'Video view recorded', totalView: video.total_view });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ message: 'Failed to track view' });
  }
});
// get analytics
router.get('/:videoId/analytics', async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.status(200).json({
      totalLikes: video.total_like,
      totalViews: video.total_view,
      totalComments: video.total_comment,
      engagementRate: video.engagementRate,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch video analytics' });
  }
});
// user can send a request for renting the video 
// Create Razorpay Order and Save Transaction
router.post('/buy-video/:videoId',isUser, async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const videoId = req.params.videoId;

    // 1. Find the video
    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    // if (!video.isApproved || video.status !== 1) {
    //   return res.status(403).json({ message: 'This video is not available for purchase' });
    // }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.rentedVideos.includes(videoId)) {
      return res.status(400).json({ message: 'Video already purchased or rented' });
    }

    const price = video.price;
    if (!price) {
      return res.status(400).json({ message: 'Price not available for this video' });
    }

    // 2. Create Razorpay Order
    const amountInPaise = price * 100; // Razorpay expects amount in paise (1 Rupee = 100 Paise)

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${uuidv4().slice(0, 20)}`,

      notes: {
        userId: userId.toString(),
        videoId: videoId.toString(),
      }
    });

    // 3. Save the transaction in your DB as "pending" initially
    const newTransaction = new Transaction({
      unique_id: uuidv4(),
      user_id: userId,
      package_id: video.package_id || null, // if video has package, else null
      transaction_id: razorpayOrder.id,
      price: price.toString(),
      description: `Purchase of video: ${video.name}`,
      status: 0, // 0 => pending
    });

    await newTransaction.save();

    // 4. Return order details to frontend to complete payment
    res.status(200).json({
      message: "Order created",
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY, // frontend will use this to complete payment
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// After frontend completes payment, it will hit this endpoint
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, videoId } = req.body;
    const userId = req.user.id;

    // 1. Verify Signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // 2. Update Transaction
    const transaction = await Transaction.findOneAndUpdate(
      { transaction_id: razorpay_order_id },
      { status: 1 }, // mark as success
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // 3. Update User's rentedVideos
    const user = await User.findById(userId);
    if (!user.rentedVideos.includes(videoId)) {
      user.rentedVideos.push(videoId);
      await user.save();
    }

    res.status(200).json({ message: 'Payment verified and video purchased successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get all Top 10 movies
router.get('/top10-movies', async (req, res) => {
  try {
    const top10Movies = await Video.find({ isTop10: true, isApproved: true })
      .sort({ approvalDate: -1 }) // Optional: Latest approved movies first
      .limit(10); // Just a safety limit

    res.status(200).json({
      message: 'Top 10 movies fetched successfully',
      movies: top10Movies
    });
  } catch (err) {
    console.error('Error fetching Top 10 movies:', err);
    res.status(500).json({ message: 'Server error while fetching Top 10 movies' });
  }
});
// Continue Watching List for a User
// GET /api/user/continue-watching
router.post('/continue-watching', async (req, res) => {
  const { userId, videoId, progress } = req.body;
  console.log(req.body)
  try {
    const existing = await ContinueWatching.findOne({ userId, videoId });
    console.log("existing videos", existing);
    if (existing) {
      existing.progress = progress;
      existing.updatedAt = Date.now();
      await existing.save();
    } else {
      await ContinueWatching.create({ userId, videoId, progress });
    }
    res.json({ message: 'Progress saved' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save progress', error: error.message });
  }
});
router.get('/continue-watching',isUser, async (req, res) => {
  const user_id = req.user._id;
  console.log(user_id)
  try {
    const list = await ContinueWatching.find({  userId : user_id  })
      .sort({ updatedAt: -1 })
      .populate('videoId');
    res.json({ message: 'Continue Watching list fetched successfully', data: list });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch list', error: error.message });
  }
});
 // make the video fav 
 // Endpoint to mark a video as favorite
router.put('/user/favorites/:videoId',isUser, async (req, res) => {
  const userId = req.user._id; // Assuming user ID is available in the request (e.g., from a JWT)
  const videoId = req.params.videoId;

  try {
    // Find the user by ID and add the video to the favorites array
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the video is already in favorites
    if (user.favorites.includes(videoId)) {
      return res.status(400).json({ message: 'Video already marked as favorite' });
    }

    // Add video to favorites
    user.favorites.push(videoId);
    await user.save();

    return res.status(200).json({ message: 'Video marked as favorite' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});
// Endpoint to get the list of favorite videos for a user
router.get('/user/favorites',isUser, async (req, res) => {
  const userId = req.user._id; // Assuming user ID is available in the request (e.g., from a JWT)

  try {
    // Find the user by ID and populate the favorites field with video details
    const user = await User.findById(userId).populate('favorites');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the list of favorite videos
    return res.status(200).json(user.favorites);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /videos/:videoId/rate — Rate or update rating for a video
router.post('/rate-video', isUser,async (req, res) => {
  try {
    const { videoId, rating } = req.body;
    const user_id = req.user._id;
    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    // Remove any existing rating by this user
    video.ratings = video.ratings.filter(r => r.user.toString() !== userId);

    // Add new rating
    video.ratings.push({ user: userId, value: rating });

    // Recalculate average rating
    const total = video.ratings.reduce((sum, r) => sum + r.value, 0);
    video.ratingCount = video.ratings.length;
    video.averageRating = total / video.ratingCount;

    await video.save(); // This is where the error happens

    res.status(200).json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Error rating video:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;


