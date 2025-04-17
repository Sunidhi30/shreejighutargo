const express = require('express');
const nodemailer = require("nodemailer");
const { uploadToCloudinary } = require("../utils/cloudinary");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const User = require('../models/User');
const ADMIN_EMAIL = "sunidhi@gmail.com";
const ADMIN_PHONE = "1234567890"; // Optional
const ADMIN_OTP = "0000";
const Type =require("../models/Type")
const TvLogin = require('../models/TvLogin');
const { v4: uuidv4 } = require('uuid');
const Avatar = require("../models/Avatar");
const Category = require("../models/Category")
const Cast = require("../models/Cast");
const JWT_SECRET = process.env.JWT_SECRET || "Apple";
// const { protect,verifyToken } = require('../middleware/auth');
const { protect } = require("../middleware/auth");
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
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true }); // Creates folder if missing
}
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
// router.post('/verify-otp', async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: 'user not found' });
//     }

//     if (user.otp !== otp || user.otpExpiry < new Date()) {
//       return res.status(400).json({ message: 'Invalid or expired OTP' });
//     }

//     // Clear OTP after verification
//     user.otp = null;
//     user.otpExpiry = null;
    
//     // Capture metadata
// const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
// const device = req.headers['user-agent'];
// let location = 'Unknown';  // Default value

// try {
//   // Geolocation fetch
//   const geoRes = await axios.get(`http://ip-api.com/json/${ip}`);
//   const { city, country } = geoRes.data;

//   if (city && country) {
//     location = `${city}, ${country}`;
//   } else {
//     location = 'Location not available';  // Fallback in case of missing location
//   }
// } catch (err) {
//   console.log('Geolocation fetch failed:', err.message);
//   location = 'Location fetch failed';  // Fallback in case of error in API call
// }

// // Save login info
// user.lastLogin = {
//   ip,
//   device,
//   location,
//   time: new Date(),
// };
//     await user.save();

//     const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
//       expiresIn: '7d',
//     });

//     res.status(200).json({
//       message: 'Login successful',
//       token,
//       user: {
//         id: user._id,
//         email: user.email,
//         lastLogin: user.lastLogin,  // Include the lastLogin data in the response
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'OTP verification failed', error: err.message });
// }
// }); 
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

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
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
// GET /get_all_types
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
//get types 
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
// get category 
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
    const languages = await Language.find().sort({ name: 1 }); // Optional sorting by name

    return res.status(200).json({
      message: 'Languages fetched successfully',
      data: languages
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
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
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-otp -otpExpiry') // exclude sensitive fields if needed
      .populate('watchlist')
      .populate('downloads')
      .populate('subscriptions')
      .populate('rentedVideos')
      .populate('transactions');

    if (!user || user.deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Email will be included automatically
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router; 
