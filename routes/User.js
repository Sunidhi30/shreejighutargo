const express = require('express');
const nodemailer = require("nodemailer");
const { uploadToCloudinary } = require("../utils/cloudinary");
const jwt = require('jsonwebtoken');
const Contest = require("../models/Contest")
const TVSeason = require("../models/TVShow")
const TVShow= require("../models/TVShow")
const Series = require("../models/Series")
const Dynamic = require("../models/DynamicVideo")
const dotenv = require('dotenv');
const geoip = require('geoip-lite'); // For IP location detection
const useragent = require('useragent'); // For device detection
const AppRating = require("../models/appRating.model")
const mongoose = require("mongoose");
const ContinueWatching = require("../models/ContinueWatching")
const User = require('../models/User');
const HomeSection = require('../models/HomeSection');
const cloudinary = require("cloudinary");
const  Language = require("../models/Language");
const SubscriptionPlan= require("../models/SubscriptionPlan");
const VideoView = require('../models/videoView'); // Adjust the path according to your project structure
const Comment = require('../models/Commet');
const Type =require("../models/Type")
const Vendor=require("../models/Vendor")
const TvLogin = require('../models/TvLogin');
const { v4: uuidv4 } = require('uuid');
const Avatar = require("../models/Avatar");
const Category = require("../models/Category")
const Subscriptions = require("../models/Subscription");
const Cast = require("../models/Cast");
const JWT_SECRET = process.env.JWT_SECRET || "Apple";
const razorpay = require('../utils/razorpay');
const PlatformStats =require("../models/PlatformStats")
const { protect, isUser, verifyAdmin } = require("../middleware/auth");
const { body, validationResult } = require('express-validator');
const multer = require("multer");
const storage = multer.memoryStorage();
const  Admin = require("../models/Admin");
const TVEpisode = require("../models/TvshowEpisode")
const Season  = require("../models/Season")
const Episode = require("../models/Episode")
const Package = require("../models/Package");
const Transaction= require("../models/transactionSchema")
// const Transaction = require("../models/Transactions");
const PDFDocument = require("pdfkit");
const upload = multer({ storage: storage });
const UserSubscription=require("../models/userSubscriptionSchema")
require('dotenv').config();
const router = express.Router();
const Video = require("../models/Video");
const fs = require("fs");
const path = require("path");
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
    from: `"Backend testing the videos" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for Admin Login',
    text: `Your One-Time Password (OTP) is: ${otp}\nThis OTP is valid for 10 minutes.`,
  };
  await transporter.sendMail(mailOptions);
};
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
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
// router.post('/signup', async (req, res) => {
//   try {
//     const { email, device_name, device_type, device_token, device_id } = req.body;

//     if (!email || !device_name || !device_type || !device_token || !device_id) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

//     // Store session data
//     req.session.signupData = {
//       email,
//       otp,
//       otpExpiry,
//       device_name,
//       device_type,
//       device_token,
//       device_id
//     };

//     await sendOTPEmail(email, otp);

//     res.status(200).json({success: 200, message: 'OTP sent to email. Please verify to complete signup.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// });
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

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Temporarily create a user with otp but not finalized
    const tempUser = new User({
      email,
      otp,
      otpExpiry,
      device_name,
      device_type,
      device_token,
      device_id,
    });

    await tempUser.save();

    await sendOTPEmail(email, otp);

    res.status(200).json({
      success: 200,
      message: 'OTP sent to email. Please verify to complete signup.'
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// sign up otp
// router.post('/verify-signup-otp', async (req, res) => {
//   try {
//     const { otp } = req.body;
//     const signupData = req.session.signupData;

//     if (!signupData) {
//       return res.status(400).json({ message: 'Session expired or no OTP request found' });
//     }

//     if (signupData.otp !== otp || Date.now() > signupData.otpExpiry) {
//       return res.status(400).json({ message: 'Invalid or expired OTP' });
//     }

//     // Save user to DB
//     const newUser = new User({ email: signupData.email });
//     await newUser.save();
//     console.log(newUser)
//     // Save device info
//     const device = new DeviceSync({
//       user_id: newUser._id,
//       device_name: signupData.device_name,
//       device_type: signupData.device_type,
//       device_token: signupData.device_token,
//       device_id: signupData.device_id,
//     });
  
//     await device.save();

//     // Clear session
//     req.session.signupData = null;

//     // Generate JWT token
//     const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, {
//       expiresIn: '7d',
//     });

//     res.status(200).json({
//       message: 'Signup successful',
//       token,
//       success: 200,
//       user: {
//         id: newUser._id,
//         email: newUser.email,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// }); 
router.post('/verify-signup-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });

    if (!user || !user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP request found or user does not exist' });
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP fields after verification
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Signup successful',
      token,
      success: 200,
      user: {
        id: user._id,
        email: user.email,
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
    console.log("email:", req.body.email) // Fixed the console.log format

    const user = await User.findOne({ email });
    console.log(user)
    if (!user) {
      return res.status(404).json({ message: 'user not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 mins

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(email, otp);

    res.status(200).json({ 
      success: 200,
      message: 'OTP sent to email' 
    });
    
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error sending OTP', error: err.message });
  }
});

// router.post('/login', async (req, res) => {
//   try {
//     const { email } = req.body;
//     console.log("email"+req.body)

//     const user = await User.findOne({ email });
//     console.log(user)
//     if (!user) {
//       return res.status(404).json({ message: 'user not found' });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 mins

//     user.otp = otp;
//     user.otpExpiry = otpExpiry;
//     await user.save();

//     await sendOTPEmail(email, otp);

//     req.session.email = email;

//     res.status(200).json({ 
//       success: 200,
//       message: 'OTP sent to email' 
//     });
    
//   } catch (err) {
//     res.status(500).json({  success: false, message: 'Error sending OTP', error: err.message });
//   }
// });
// Step 2: Verify OTP and Login
// router.post('/verify-otp', async (req, res) => {
//   try {
//     const { otp } = req.body;
//     const email = req.session.email; // Get email from session
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: 'user not found' });

//     if (user.otp !== otp || user.otpExpiry < new Date()) {
//       return res.status(400).json({ message: 'Invalid or expired OTP' });
//     }

//     // Clear OTP after verification
//     user.otp = null;
//     user.otpExpiry = null;

//     // Capture metadata
//     // const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
//     const device = req.headers['user-agent'];
//   let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
// if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127')) {
//   ip = '8.8.8.8'; // Fallback for local testing
// }
//     let location = 'Unknown';

//     try {
//       // Step 1: Get coordinates from IP
//       const ipLocationRes = await axios.get(`https://ipapi.co/${ip}/json/`);
//       const { latitude, longitude } = ipLocationRes.data;

//       // Step 2: Convert coordinates to readable location using OpenCage
//       const openCageApiKey = '420a26521c014c6299ef2a241f068161'; // 🔁 Replace with your actual key
//       const geoRes = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${openCageApiKey}`);
      
//       if (geoRes.data.results && geoRes.data.results.length > 0) {
//         location = geoRes.data.results[0].formatted;
//       } else {
//         location = 'Location not available';
//       }
//     } catch (geoErr) {
//       console.error('Geolocation failed:', geoErr.message);
//       location = 'Location fetch failed';
//     }

//     // Save login info
//     user.lastLogin = {
//       ip,
//       device,
//       location,
//       time: new Date(),
//     };

//     await user.save();

//     const token = jwt.sign({ userID: user._id, email: user.email, role: user.role }, JWT_SECRET, {
//       expiresIn: '7d',
//     });

//     res.status(200).json({
//       message: 'Login successful',
//       token,
//       success: 200,
//       user: {
//         id: user._id,
//         role: user.role,
//         email: user.email,
//         lastLogin: user.lastLogin,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'OTP verification failed', error: err.message });
//   }
// });
// router.post('/login-verify-otp', async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     if (user.otp !== otp || user.otpExpiry < new Date()) {
//       return res.status(400).json({ message: 'Invalid or expired OTP' });
//     }

//     // Clear OTP after verification
//     user.otp = null;
//     user.otpExpiry = null;

//     // Get device and IP info
//     const device = req.headers['user-agent'];
//     let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
//     if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127')) {
//       ip = '8.8.8.8'; // fallback for local testing
//     }

//     let location = 'Unknown';

//     try {
//       const ipLocationRes = await axios.get(`https://ipapi.co/${ip}/json/`);
//       const { latitude, longitude } = ipLocationRes.data;

//       const openCageApiKey = '420a26521c014c6299ef2a241f068161'; // replace with your actual key
//       const geoRes = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${openCageApiKey}`);

//       if (geoRes.data.results && geoRes.data.results.length > 0) {
//         location = geoRes.data.results[0].formatted;
//       } else {
//         location = 'Location not available';
//       }
//     } catch (geoErr) {
//       console.error('Geolocation failed:', geoErr.message);
//       location = 'Location fetch failed';
//     }

//     // Save login info
//     user.lastLogin = {
//       ip,
//       device,
//       location,
//       time: new Date(),
//     };

//     await user.save();

//     const token = jwt.sign({ userID: user._id, email: user.email, role: user.role }, JWT_SECRET, {
//       expiresIn: '7d',
//     });

//     res.status(200).json({
//       message: 'Login successful',
//       token,
//       success: 200,
//       user: {
//         id: user._id,
//         role: user.role,
//         email: user.email,
//         lastLogin: user.lastLogin,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'OTP verification failed', error: err.message });
//   }
// });
router.post('/login-verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Input validation
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if OTP exists and is not expired
    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ 
        success: false, 
        message: 'No OTP request found. Please request a new OTP' 
      });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }

    // Clear OTP after verification
    user.otp = null;
    user.otpExpiry = null;

    // Get device and IP info
    const device = req.headers['user-agent'];
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127')) {
      ip = '8.8.8.8'; // fallback for local testing
    }

    let location = 'Unknown';

    try {
      const ipLocationRes = await axios.get(`https://ipapi.co/${ip}/json/`);
      const { latitude, longitude } = ipLocationRes.data;

      const openCageApiKey = process.env.OPENCAGE_API_KEY || '420a26521c014c6299ef2a241f068161';
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

    // Add to device sessions history
    user.deviceSessions.push({
      ip,
      device,
      location,
      time: new Date(),
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userID: user._id, 
        email: user.email, 
        role: user.role 
      }, 
      process.env.JWT_SECRET || JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
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
    console.error('OTP verification error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'OTP verification failed', 
      error: err.message 
    });
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
// Create a new profile for user
router.post('/profiles', async (req, res) => {
  try {
    const { userId, name, avatar, isKid = false, pin = null } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and profile name are required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if profiles array exists, if not create it
    if (!user.profiles) {
      user.profiles = [];
    }

    // Check profile limit (Netflix allows 5 profiles)
    if (user.profiles.length >= 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum 5 profiles allowed per account' 
      });
    }

    // Check if profile name already exists
    const existingProfile = user.profiles.find(profile => 
      profile.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingProfile) {
      return res.status(400).json({ 
        success: false, 
        message: 'Profile name already exists' 
      });
    }

    const newProfile = {
      _id: new mongoose.Types.ObjectId(),
      name,
      avatar: avatar || 'default-avatar.png',
      isKid,
      pin: isKid ? null : pin, // Kids profiles don't need PIN
      watchHistory: [],
      preferences: {
        language: user.languagePreference || 'en',
        maturityRating: isKid ? 'G' : 'R'
      },
      createdAt: new Date()
    };

    user.profiles.push(newProfile);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      profile: newProfile
    });

  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
// Get all profiles for a user
router.get('/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('profiles');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      profiles: user.profiles || []
    });

  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
// Update a profile
router.put('/profiles/:userId/:profileId', async (req, res) => {
  try {
    const { userId, profileId } = req.params;
    const { name, avatar, pin } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const profile = user.profiles.id(profileId);
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }

    // Check if new name already exists in other profiles
    if (name && name !== profile.name) {
      const existingProfile = user.profiles.find(p => 
        p._id.toString() !== profileId && 
        p.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingProfile) {
        return res.status(400).json({ 
          success: false, 
          message: 'Profile name already exists' 
        });
      }
      profile.name = name;
    }

    if (avatar) profile.avatar = avatar;
    if (pin !== undefined && !profile.isKid) profile.pin = pin;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
router.delete('/profiles/:userId/:profileId', async (req, res) => {
  try {
    const { userId, profileId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const profile = user.profiles.id(profileId);
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }

    // Don't allow deletion if it's the last profile
    if (user.profiles.length === 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete the last profile' 
      });
    }

    user.profiles.pull(profileId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });

  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
// Get all connected devices for a user
router.get('/devices/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user with device sessions
    const user = await User.findById(userId).select('deviceSessions lastLogin');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get synced devices
    const syncedDevices = await DeviceSync.find({ 
      user_id: userId, 
      status: 1 
    }).select('device_name device_type device_id createdAt');

    // Get currently watching devices
    const watchingDevices = await DeviceWatching.find({ 
      user_id: userId, 
      status: 1 
    }).populate({
      path: 'device_sync',
      select: 'device_name device_type'
    });

    // Combine device information
    const devicesInfo = {
      lastLogin: user.lastLogin,
      activeSessions: user.deviceSessions || [],
      syncedDevices: syncedDevices,
      currentlyWatching: watchingDevices
    };

    res.status(200).json({
      success: true,
      devices: devicesInfo
    });

  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
// Add/Sync a new device
router.post('/devices/sync', async (req, res) => {
  try {
    const { 
      userId, 
      deviceName, 
      deviceType, 
      deviceToken, 
      deviceId 
    } = req.body;

    if (!userId || !deviceName || !deviceType || !deviceToken || !deviceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'All device fields are required' 
      });
    }

    // Check if device already exists
    const existingDevice = await DeviceSync.findOne({ 
      user_id: userId, 
      device_id: deviceId 
    });

    if (existingDevice) {
      // Update existing device
      existingDevice.device_name = deviceName;
      existingDevice.device_type = deviceType;
      existingDevice.device_token = deviceToken;
      existingDevice.status = 1;
      await existingDevice.save();

      return res.status(200).json({
        success: true,
        message: 'Device updated successfully',
        device: existingDevice
      });
    }

    // Create new device sync
    const newDevice = new DeviceSync({
      user_id: userId,
      device_name: deviceName,
      device_type: deviceType,
      device_token: deviceToken,
      device_id: deviceId
    });

    await newDevice.save();

    // Get user IP and location info
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const agent = useragent.parse(userAgent);
    const geo = geoip.lookup(ip);

    // Update user's device sessions
    const user = await User.findById(userId);
    if (user) {
      const sessionInfo = {
        ip: ip,
        device: `${agent.family} ${agent.major} on ${agent.os.family}`,
        location: geo ? `${geo.city}, ${geo.country}` : 'Unknown',
        coordinates: geo ? { lat: geo.ll[0], lng: geo.ll[1] } : null,
        time: new Date()
      };

      // Update last login
      user.lastLogin = sessionInfo;

      // Add to device sessions (keep last 10 sessions)
      if (!user.deviceSessions) user.deviceSessions = [];
      user.deviceSessions.unshift(sessionInfo);
      if (user.deviceSessions.length > 10) {
        user.deviceSessions = user.deviceSessions.slice(0, 10);
      }

      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Device synced successfully',
      device: newDevice
    });

  } catch (error) {
    console.error('Sync device error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
// Remove/Unsync a device
router.delete('/devices/:userId/:deviceId', async (req, res) => {
  try {
    const { userId, deviceId } = req.params;

    // Remove from device sync
    const device = await DeviceSync.findOneAndUpdate(
      { user_id: userId, device_id: deviceId },
      { status: 0 },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ 
        success: false, 
        message: 'Device not found' 
      });
    }

    // Also remove from watching devices
    await DeviceWatching.findOneAndUpdate(
      { user_id: userId, device_id: deviceId },
      { status: 0 }
    );

    res.status(200).json({
      success: true,
      message: 'Device removed successfully'
    });

  } catch (error) {
    console.error('Remove device error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
// Start watching on a device
router.post('/devices/start-watching', async (req, res) => {
  try {
    const { userId, deviceId } = req.body;

    if (!userId || !deviceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and Device ID are required' 
      });
    }

    // Check if device is synced
    const syncedDevice = await DeviceSync.findOne({ 
      user_id: userId, 
      device_id: deviceId, 
      status: 1 
    });

    if (!syncedDevice) {
      return res.status(404).json({ 
        success: false, 
        message: 'Device not synced or not found' 
      });
    }

    // Check if already watching on this device
    let watchingDevice = await DeviceWatching.findOne({ 
      user_id: userId, 
      device_id: deviceId 
    });

    if (watchingDevice) {
      watchingDevice.status = 1;
      await watchingDevice.save();
    } else {
      watchingDevice = new DeviceWatching({
        user_id: userId,
        device_id: deviceId,
        status: 1
      });
      await watchingDevice.save();
    }

    res.status(200).json({
      success: true,
      message: 'Started watching on device',
      watchingDevice
    });

  } catch (error) {
    console.error('Start watching error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
// Stop watching on a device
router.post('/devices/stop-watching', async (req, res) => {
  try {
    const { userId, deviceId } = req.body;

    await DeviceWatching.findOneAndUpdate(
      { user_id: userId, device_id: deviceId },
      { status: 0 }
    );

    res.status(200).json({
      success: true,
      message: 'Stopped watching on device'
    });

  } catch (error) {
    console.error('Stop watching error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
// Get login history/sessions
router.get('/sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('deviceSessions lastLogin');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      sessions: {
        lastLogin: user.lastLogin,
        history: user.deviceSessions || []
      }
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
//connect-tv
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
// router.get('/search-movies', async (req, res) => {
//   const { title } = req.query;

//   try {
//     if (!title) {
//       return res.status(400).json({ message: 'Title query is required.' });
//     }

//     const movies = await Video.find({
//       name: { $regex: title, $options: 'i' },
//       isApproved: true // Only approved videos
//     });

//     res.json(movies);
//   } catch (error) {
//     res.status(500).json({ message: 'Search failed', error: error.message });
//   }
// });
router.get('/search-movies', async (req, res) => {
  const { title } = req.query;

  try {
    // Build the query
    const query = {
      isApproved: true,
      ...(title && { name: { $regex: title, $options: 'i' } }) // Only add name filter if title exists
    };

    const movies = await Video.find(query);
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
router.get('/get_videos_by_type', async (req, res) => {
  try {
    const videos = await Video.find({ isApproved: true })
      .populate('type_id', 'name') // populate type name
      .sort({ createdAt: -1 }); // optional: latest first

    // Group videos by type
    const groupedVideos = {};

    videos.forEach(video => {
      const typeName = video.type_id?.name || 'Unknown';
      if (!groupedVideos[typeName]) {
        groupedVideos[typeName] = [];
      }
      groupedVideos[typeName].push(video);
    });

    return res.status(200).json({
      message: 'Videos grouped by type fetched successfully',
      data: groupedVideos
    });
  } catch (error) {
    console.error('Error fetching videos by type:', error);
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
// GET /api/users/get_video_types
router.get('/get_video_types', async (req, res) => {
  try {
    const types = await Type.find({ status: 1 }); // Fetch only active types
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    console.error('Error fetching video types:', error);
    res.status(500).json({ success: false, message: 'Server error fetching video types' });
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
      success : 200,
      message: 'Languages with videos fetched successfully',
      data: results
    });
  } catch (error) {
    console.error('Error fetching languages with videos:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});
//this is with query langauge 
router.get('/withquery-get_languages', async (req, res) => {
  try {
    const { name } = req.query;

    // let query = {};
    // if (name) {
    //   // Case-insensitive search for language name
    //   query.name = { $regex: new RegExp(name, 'i') };
    // }

    const languages = await Language.find({name}).sort({ name: 1 });

    const results = await Promise.all(
      languages.map(async (language) => {
        const videos = await Video.find({ language_id: language._id, isApproved: true })
                                  .select('name thumbnail video_720 status');
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
      success:200,
      message: 'Languages with videos fetched successfully',
      data: results
    });

  } catch (error) {
    console.error('Error fetching languages with videos:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});
//get cast
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
// //do the investments in particular plan 
// router.post('/invest-plan', async (req, res) => {
//   const { userId, packageId } = req.body;

//   try {
//     // Find user and package
//     const user = await User.findById(userId);
//     const selectedPackage = await SubscriptionPlan.findById(packageId);

//     if (!user || !selectedPackage) {
//       return res.status(404).json({ message: 'User or Package not found' });
//     }

//     // Create a transaction for the investment
//     const transaction = new Transaction({
//       unique_id: `txn_${Date.now()}`,
//       user_id: userId,
//       package_id: packageId,
//       transaction_id: `txn_${Date.now()}`,
//       price: selectedPackage.price.toString(),
//       status: 1,  // Successful status
//       amount: selectedPackage.price,
//       payment_status: 'completed'
//     });

//     await transaction.save();

//     // Add the transaction to user's profile
//     user.transactions.push(transaction._id);
//     await user.save();

//     // Update admin's wallet (add investment amount)
//     const admin = await Admin.findOne();
//     if (admin) {
//       admin.wallet += selectedPackage.price;
//       await admin.save();
//     }

//     res.status(200).json({ message: 'Investment successful', transaction });
//   } catch (error) {
//     console.error(error);
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
// API to get a specific plan details (when user clicks on a plan)
router.get('/plans/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found or inactive'
      });
    }
    
    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plan',
      error: error.message
    });
  }
});
// Single API to initiate subscription with comprehensive eligibility check
router.post('/initiate-subscription', isUser, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    
    // Validate plan exists and is active
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found or inactive'
      });
    }
    
    // Check for existing active subscriptions
    const existingActiveSubscription = await UserSubscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() } // Ensure subscription hasn't expired
    }).populate('plan');
    
    if (existingActiveSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription. You can only update your plan.',
        data: {
          currentSubscription: {
            planName: existingActiveSubscription.plan.name,
            startDate: existingActiveSubscription.startDate,
            endDate: existingActiveSubscription.endDate,
            status: existingActiveSubscription.status,
            daysRemaining: Math.ceil((existingActiveSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24))
          },
          suggestedAction: 'upgrade_or_wait'
        }
      });
    }
    
    // Check for pending transactions for ANY subscription plan (prevent double transactions)
    const pendingTransaction = await Transaction.findOne({
      user: userId,
      status: 'pending',
      type: 'subscription'
    });
    
    if (pendingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'You have a pending payment transaction. Please complete or cancel it first.',
        data: {
          pendingTransactionId: pendingTransaction._id,
          amount: pendingTransaction.amount,
          createdAt: pendingTransaction.createdAt
        }
      });
    }
    
    // Check for any subscription for the same plan (including expired/canceled)
    const existingPlanSubscription = await UserSubscription.findOne({
      user: userId,
      plan: planId
    }).populate('plan');
    
    if (existingPlanSubscription) {
      const subscriptionStatus = {
        planName: existingPlanSubscription.plan.name,
        startDate: existingPlanSubscription.startDate,
        endDate: existingPlanSubscription.endDate,
        status: existingPlanSubscription.status
      };
      
      if (existingPlanSubscription.status === 'expired') {
        // Allow renewal of expired subscription
        return res.status(200).json({
          success: true,
          message: 'Your previous subscription has expired. You can renew it.',
          data: {
            plan: {
              id: plan._id,
              name: plan.name,
              price: plan.price,
              duration: plan.duration,
              maxDevices: plan.maxDevices,
              maxProfiles: plan.maxProfiles
            },
            user: {
              id: userId,
              name: req.user.name,
              email: req.user.email
            },
            previousSubscription: subscriptionStatus,
            action: 'renewal'
          }
        });
      } else if (existingPlanSubscription.status === 'canceled') {
        // Allow reactivation of canceled subscription
        return res.status(200).json({
          success: true,
          message: 'You can reactivate your canceled subscription.',
          data: {
            plan: {
              id: plan._id,
              name: plan.name,
              price: plan.price,
              duration: plan.duration,
              maxDevices: plan.maxDevices,
              maxProfiles: plan.maxProfiles
            },
            user: {
              id: userId,
              name: req.user.name,
              email: req.user.email
            },
            previousSubscription: subscriptionStatus,
            action: 'reactivation'
          }
        });
      }
    }
    
    // All checks passed - user is eligible for new subscription
    res.status(200).json({
      success: true,
      message: 'Subscription can be initiated. You are eligible for this plan.',
      data: {
        plan: {
          id: plan._id,
          name: plan.name,
          price: plan.price,
          duration: plan.duration,
          maxDevices: plan.maxDevices,
          maxProfiles: plan.maxProfiles,
          description: plan.description
        },
        user: {
          id: userId,
          name: req.user.name,
          email: req.user.email
        },
        eligibility: {
          canSubscribe: true,
          hasActiveSubscription: false,
          hasPendingPayment: false
        },
        action: 'new_subscription'
      }
    });
    
  } catch (error) {
    console.error('Subscription initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription eligibility',
      error: error.message
    });
  }
});

// Enhanced create-order with additional validation
router.post('/create-order', isUser, async (req, res) => {
  try {
    console.log("Create order request body:", req.body);

    const { planId, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validate planId
    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required.' });
    }

    // Fetch the subscription plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      console.log("Plan not found for ID:", planId);
      return res.status(404).json({ success: false, message: 'Subscription plan not found.' });
    }

    // Validate plan price
    if (!plan.price || isNaN(plan.price)) {
      console.log("Invalid plan price:", plan.price);
      return res.status(400).json({ success: false, message: 'Invalid plan price.' });
    }

    const amountInPaise = Math.round(plan.price * 100); // Convert to paise

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Auto-capture
    };

    console.log("Creating Razorpay order with options:", options);

    // Create order in Razorpay
    const order = await razorpay.orders.create(options);
    console.log("Razorpay order created successfully:", order);

    // Create transaction record in your database
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

    console.log("Transaction created:", transaction);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      transactionId: transaction._id,
      planDetails: {
        name: plan.name,
        duration: plan.duration,
        price: plan.price,
        maxDevices: plan.maxDevices,
        maxProfiles: plan.maxProfiles,
        description: plan.description,
      },
    });
  } catch (err) {
    console.error('Create Order Error:', err);

    // Handle specific Razorpay errors
    if (err && err.error && err.error.description) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay Error: ' + err.error.description,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Payment initiation failed',
      error: err.message,
    });
  }
});

// Enhanced verify-payment with better validation
router.post('/verify-payment', isUser, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    transactionId,
    planId
  } = req.body;
  const userId = req.user.id;

  try {
    // Verify the transaction belongs to the user
    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: userId,
      status: 'pending'
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or already processed'
      });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await Transaction.findByIdAndUpdate(transactionId, {
        status: 'failed',
        failureReason: 'Signature verification failed'
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed' 
      });
    }

    // Double-check no active subscription exists before creating new one
    const existingActiveSubscription = await UserSubscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    if (existingActiveSubscription) {
      await Transaction.findByIdAndUpdate(transactionId, {
        status: 'failed',
        failureReason: 'User already has active subscription'
      });
      return res.status(400).json({
        success: false,
        message: 'Cannot complete payment: You already have an active subscription'
      });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      await Transaction.findByIdAndUpdate(transactionId, {
        status: 'failed',
        failureReason: 'Plan not found'
      });
      return res.status(404).json({ 
        success: false,
        message: 'Subscription plan not found' 
      });
    }

    // Calculate end date based on plan duration
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration);

    // Update transaction status
    await Transaction.findByIdAndUpdate(transactionId, {
      status: 'completed',
      paymentId: razorpay_payment_id,
      completedAt: new Date()
    });

    // Create user subscription
    const newSubscription = await UserSubscription.create({
      user: userId,
      plan: planId,
      startDate: startDate,
      endDate: endDate,
      status: 'active',
      paymentMethod: 'razorpay',
      paymentId: razorpay_payment_id,
      transactionId: transactionId
    });

    console.log("Subscription created successfully:", newSubscription);

    return res.json({ 
      success: true, 
      message: 'Payment verified and subscription activated successfully',
      data: {
        subscription: {
          id: newSubscription._id,
          planName: plan.name,
          startDate: newSubscription.startDate,
          endDate: newSubscription.endDate,
          status: newSubscription.status,
          daysRemaining: Math.ceil((newSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24))
        },
        transaction: {
          id: transactionId,
          paymentId: razorpay_payment_id,
          amount: plan.price
        }
      }
    });
    
  } catch (err) {
    console.error('Verify Payment Error:', err);
    
    // Mark transaction as failed if error occurs
    try {
      await Transaction.findByIdAndUpdate(transactionId, {
        status: 'failed',
        failureReason: err.message
      });
    } catch (updateError) {
      console.error('Error updating transaction status:', updateError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification process failed', 
      error: err.message 
    });
  }
});

// Get current subscription with detailed information
// router.get('/my-subscription', isUser, async (req, res) => {
//   try {
//     const userId = req.user.id;
    
//     // Find active subscription
//     const activeSubscription = await UserSubscription.findOne({
//       user: userId,
//       status: 'active',
//       endDate: { $gt: new Date() }
//     }).populate('plan');
    
//     if (!activeSubscription) {
//       // Check for any subscription (including expired/canceled)
//       const lastSubscription = await UserSubscription.findOne({
//         user: userId
//       }).populate('plan').sort({ createdAt: -1 });
      
//       return res.status(200).json({
//         success: true,
//         hasActiveSubscription: false,
//         message: 'No active subscription found',
//         data: {
//           lastSubscription: lastSubscription ? {
//             planName: lastSubscription.plan.name,
//             endDate: lastSubscription.endDate,
//             status: lastSubscription.status
//           } : null
//         }
//       });
//     }
    
//     const daysRemaining = Math.ceil((activeSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24));
    
//     res.status(200).json({
//       success: true,
//       hasActiveSubscription: true,
//       data: {
//         subscription: {
//           id: activeSubscription._id,
//           planName: activeSubscription.plan.name,
//           planDescription: activeSubscription.plan.description,
//           startDate: activeSubscription.startDate,
//           endDate: activeSubscription.endDate,
//           status: activeSubscription.status,
//           daysRemaining: daysRemaining,
//           maxDevices: activeSubscription.plan.maxDevices,
//           maxProfiles: activeSubscription.plan.maxProfiles,
//           autoRenew: activeSubscription.autoRenew
//         }
//       }
//     });
    
//   } catch (error) {
//     console.error('Get subscription error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching subscription details',
//       error: error.message
//     });
//   }
// });
router.get('/my-subscription', isUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find active subscription
    const activeSubscription = await UserSubscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('plan');
    
    if (!activeSubscription) {
      // Check for any previous subscription
      const lastSubscription = await UserSubscription.findOne({
        user: userId
      }).populate('plan').sort({ createdAt: -1 });
      
      return res.status(200).json({
        success: true,
        hasActiveSubscription: false,
        message: 'No active subscription found',
        data: {
          lastSubscription: lastSubscription ? {
            planId: lastSubscription.plan._id,
            planName: lastSubscription.plan.name,
            endDate: lastSubscription.endDate,
            status: lastSubscription.status
          } : null
        }
      });
    }
    
    const daysRemaining = Math.ceil((activeSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24));
    
    res.status(200).json({
      success: true,
      hasActiveSubscription: true,
      data: {
        subscription: {
          id: activeSubscription._id,
          planId: activeSubscription.plan._id,
          planName: activeSubscription.plan.name,
          planDescription: activeSubscription.plan.description,
          startDate: activeSubscription.startDate,
          endDate: activeSubscription.endDate,
          status: activeSubscription.status,
          daysRemaining: daysRemaining,
          maxDevices: activeSubscription.plan.maxDevices,
          maxProfiles: activeSubscription.plan.maxProfiles,
          autoRenew: activeSubscription.autoRenew
        }
      }
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription details',
      error: error.message
    });
  }
});

// // API to initiate subscription process (when user clicks "Subscribe")
// router.post('/initiate-subscription', isUser, async (req, res) => {
//   try {
//     const { planId } = req.body;
//     const userId = req.user.id;
    
//     // Check if plan exists and is active
//     const plan = await SubscriptionPlan.findById(planId);
//     if (!plan || !plan.isActive) {
//       return res.status(404).json({
//         success: false,
//         message: 'Subscription plan not found or inactive'
//       });
//     }
    
//     // Check if user already has an active subscription for this plan
//     // FIXED: Use UserSubscription instead of userSubscription
//     const existingSubscription = await UserSubscription.findOne({
//       user: userId,
//       plan: planId,
//       status: 'active'
//     });
    
//     if (existingSubscription) {
//       return res.status(400).json({
//         success: false,
//         message: 'You already have an active subscription for this plan'
//       });
//     }
    
//     // Check if user has any pending transactions for this plan
//     const pendingTransaction = await Transaction.findOne({
//       user: userId,
//       itemReference: planId,
//       status: 'pending',
//       type: 'subscription'
//     });
    
//     if (pendingTransaction) {
//       return res.status(400).json({
//         success: false,
//         message: 'You have a pending payment for this plan. Please complete or cancel it first.'
//       });
//     }
    
//     // Return plan details and user info for payment processing
//     res.status(200).json({
//       success: true,
//       message: 'Subscription can be initiated',
//       data: {
//         plan: {
//           id: plan._id,
//           name: plan.name,
//           price: plan.price,
//           duration: plan.duration,
//           durationType: plan.durationType,
//           features: plan.features
//         },
//         user: {
//           id: userId,
//           name: req.user.name,
//           email: req.user.email
//         }
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error initiating subscription',
//       error: error.message
//     });
//   }
// });
// // API to check subscription eligibility
// router.post('/check-eligibility', isUser, async (req, res) => {
//   try {
//     const { planId } = req.body;
//     const userId = req.user.id
  
    
//     // FIXED: Use UserSubscription instead of userSubscription
//     const activeSubscriptions = await UserSubscription.find({
//       user: userId,
//       status: 'active'
//     }).populate('plan');
    
//     const canSubscribe = activeSubscriptions.length === 0;
    
//     res.status(200).json({
//       success: true,
//       data: {
//         canSubscribe,
//         activeSubscriptions: activeSubscriptions.map(sub => ({
//           planName: sub.plan.name,
//           endDate: sub.endDate
//         })),
//         message: canSubscribe ? 'Eligible for subscription' : 'Already has active subscription'
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error checking eligibility',
//       error: error.message
//     });
//   }
// });
// router.post('/create-order',  isUser,async (req, res) => {
//   const { planId,  paymentMethod } = req.body;
//   const userId = req.user.id;

//   try {
//     const plan = await SubscriptionPlan.findById(planId);
//     if (!plan) return res.status(404).json({ message: 'Plan not found' });

//     if (!plan.price) return res.status(400).json({ message: 'Plan price not set' });

//     const options = {
//       amount: plan.price * 100, // Razorpay requires amount in paisa
//       currency: 'INR',
//       receipt: `receipt_${Date.now()}`,
//     };

//     const order = await razorpay.orders.create(options);
//     console.log("Razorpay Order Created:", order);

//     const transaction = await Transaction.create({
//       user: userId,
//       amount: plan.price,
//       paymentMethod,
//       paymentId: order.id,
//       status: 'pending',
//       type: 'subscription',
//       itemReference: planId,
//       itemModel: 'SubscriptionPlan',
//     });

//     console.log("Transaction Created:", transaction);

//     res.status(200).json({
//       success: true,
//       orderId: order.id,
//       amount: options.amount,
//       currency: options.currency,
//       transactionId: transaction._id,
//       userId: userId // Return for verification

//     });
//   } catch (err) {
//     console.error('Create Order Error:', err);
//     res.status(500).json({ success: false, message: 'Payment initiation failed', error: err.message });
//   }
// });
// // FIXED: Main issue was here in verify-payment
// router.post('/verify-payment',isUser, async (req, res) => {
//   const {
//     razorpay_order_id,
//     razorpay_payment_id,
//     razorpay_signature,
//     transactionId,

//     planId
//   } = req.body;
//   const userId = req.user.id;

//   try {
//     const body = razorpay_order_id + '|' + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac('sha256', process.env.RAZORPAY_SECRET)
//       .update(body.toString())
//       .digest('hex');

//     if (expectedSignature === razorpay_signature) {
//       const plan = await SubscriptionPlan.findById(planId);
//       if (!plan) return res.status(404).json({ message: 'Subscription plan not found' });

//       // Calculate end date properly based on plan duration type
//       const startDate = new Date();
//       const endDate = new Date(startDate);
      
//       if (plan.durationType === 'day') {
//         endDate.setDate(endDate.getDate() + plan.duration);
//       } else if (plan.durationType === 'month') {
//         endDate.setMonth(endDate.getMonth() + plan.duration);
//       } else if (plan.durationType === 'year') {
//         endDate.setFullYear(endDate.getFullYear() + plan.duration);
//       } else {
//         // Default to days if durationType is not specified
//         endDate.setDate(endDate.getDate() + plan.duration);
//       }

//       // Update transaction status
//       await Transaction.findByIdAndUpdate(transactionId, {
//         status: 'completed',
//         paymentId: razorpay_payment_id,
//       });

//       // FIXED: Create user subscription with correct model name and proper fields
//       const newSubscription = await UserSubscription.create({
//         user: userId,
//         plan: planId,
//         startDate: startDate,
//         endDate: endDate,
//         status: 'active', // IMPORTANT: Set status explicitly
//         paymentMethod: 'razorpay',
//         paymentId: razorpay_payment_id,
//         transactionId: transactionId
//       });

//       console.log("Subscription created successfully:", newSubscription);

//       return res.json({ 
//         success: true, 
//         message: 'Payment verified and subscription activated',
//         subscription: newSubscription
//       });
//     } else {
//       await Transaction.findByIdAndUpdate(transactionId, {
//         status: 'failed',
//       });
//       return res.status(400).json({ success: false, message: 'Payment verification failed' });
//     }
//   } catch (err) {
//     console.error('Verify Payment Error:', err);
//     res.status(500).json({ success: false, message: 'Payment verification process failed', error: err.message });
//   }
// });
// // Enhanced debug route to see what's happening
// router.get('/my-subscription', isUser, async (req, res) => {
//   try {
//     console.log('=== DEBUG MY SUBSCRIPTION ===');
//     console.log('req.user:', req.user);
   
//     console.log('req.user._id type:', typeof req.user._id);
    
//     // Try different approaches to find the subscription
//     const userIdString = req.user.id.toString();
//     const userIdObjectId = new mongoose.Types.ObjectId(req.user.id);
    
//     console.log('userIdString:', userIdString);
//     console.log('userIdObjectId:', userIdObjectId);
    
//     // Method 1: Direct query with original user ID
//     const subscription1 = await UserSubscription.findOne({
//       user: req.user.id,
//       status: 'active'
//     }).populate('plan');
//     console.log('Method 1 (direct req.user.id):', subscription1);
    
//     // Method 2: Query with ObjectId conversion
//     const subscription2 = await UserSubscription.findOne({
//       user: userIdObjectId,
//       status: 'active'
//     }).populate('plan');
//     console.log('Method 2 (ObjectId conversion):', subscription2);
    
//     // Method 3: Query without status filter
//     const subscription3 = await UserSubscription.findOne({
//       user: userIdObjectId
//     }).populate('plan');
//     console.log('Method 3 (no status filter):', subscription3);
    
//     // Method 4: Find all subscriptions for this user
//     const allUserSubs = await UserSubscription.find({
//       user: userIdObjectId
//     }).populate('plan');
//     console.log('All subscriptions for user:', allUserSubs);
    
//     // Method 5: Check if any subscriptions exist at all
//     const totalSubs = await UserSubscription.countDocuments();
//     console.log('Total subscriptions in database:', totalSubs);
    
//     // Method 6: Raw query to see actual data
//     const rawSubs = await UserSubscription.find({}).limit(5);
//     console.log('Sample raw subscriptions:', rawSubs);
    
//     // Return the best match
//     const finalSubscription = subscription2 || subscription3 || subscription1;
    
//     if (!finalSubscription) {
//       return res.status(404).json({
//         success: false,
//         message: 'No subscription found',
//         debug: {
//           userId: req.user.id,
//           userIdType: typeof req.user.id,
//           totalSubscriptions: totalSubs,
//           userSubscriptions: allUserSubs.length,
//           methods: {
//             direct: !!subscription1,
//             objectId: !!subscription2,
//             noStatus: !!subscription3
//           }
//         }
//       });
//     }
    
//     res.status(200).json({
//       success: true,
//       data: finalSubscription,
//       debug: {
//         foundWith: subscription2 ? 'ObjectId' : subscription3 ? 'NoStatus' : 'Direct',
//         totalUserSubs: allUserSubs.length
//       }
//     });
    
//   } catch (error) {
//     console.error('Get subscription error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching subscription',
//       error: error.message,
//       stack: error.stack
//     });
//   }
// });
// // Get subscription history
// router.get('/subscription-history', isUser, async (req, res) => {
//   try {
//     // FIXED: Use UserSubscription instead of userSubscription
//     const subscriptions = await UserSubscription.find({
//       user: req.user.id
//     }).populate('plan').sort({ createdAt: -1 });
    
//     res.status(200).json({
//       success: true,
//       count: subscriptions.length,
//       data: subscriptions
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching subscription history',
//       error: error.message
//     });
//   }
// });
//Cancel subscription (turn off auto-renewal)
router.patch('/cancel-subscription', isUser, async (req, res) => {
  try {
    const subscription = await UserSubscription.findOne({
      user: req.user.id,
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
//Like a video
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
    video.comments.push(newComment._id);
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
// Search videos by name
// router.get('/search', async (req, res) => {
//   const { name } = req.query;

//   if (!name) {
//     return res.status(400).json({
//       success: false,
//       message: 'Please provide a search query (name)'
//     });
//   }

//   try {
//     const videos = await Video.find({
//       name: { $regex: name, $options: 'i' }
//     })
//     .populate('category_id', 'name')
//     .populate('cast_ids', 'name')
//     .populate('language_id', 'name')
//     .populate('producer_id', 'name')
//     .populate('vendor_id', 'name');
    
//     videos.forEach(video => {
//       console.log("Category: ", video.category_id?.name);
//       console.log("Cast IDs: ", video.cast_ids?.map(c => c.name));
//       console.log("Language: ", video.language_id?.name);
//       console.log("Producer: ", video.producer_id?.name);
//       console.log("Vendor: ", video.vendor_id?.name);
//     });
    

//     res.status(200).json({
//       success: true,
//       results: videos
//     });

//   } catch (error) {
//     console.error('Search error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Search failed',
//       error: error.message
//     });
//   }
// });
router.get('/search', async (req, res) => {
  const { name } = req.query;

  try {
    // If `name` exists, search by it; otherwise fetch all movies
    const filter = name
      ? { name: { $regex: name, $options: 'i' } }
      : {};

    const videos = await Video.find(filter)
      .populate('category_id', 'name')
      .populate('cast_ids', 'name')
      .populate('language_id', 'name')
      .populate('producer_id', 'name')
      .populate('vendor_id', 'name');

    videos.forEach(video => {
      console.log("Category: ", video.category_id?.name);
      console.log("Cast IDs: ", video.cast_ids?.map(c => c.name));
      console.log("Language: ", video.language_id?.name);
      console.log("Producer: ", video.producer_id?.name);
      console.log("Vendor: ", video.vendor_id?.name);
    });

    res.status(200).json({
      success: true,
      results: videos
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});
// GET /api/trailers/coming-soon
router.get('/coming-soon', async (req, res) => {
  try {
    const trailers = await Video.find({ 
      isComingSoon: true, 
      isApproved: true 
    }).select('name thumbnail trailer_url release_date description')
      .sort({ release_date: 1 }); // optional sorting by date

    res.status(200).json({ success: true, data: trailers });
  } catch (error) {
    console.error('Error fetching coming soon trailers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }

});
// video progress
router.post('/track-video-progress', isUser, async (req, res) => {
  try {
    const { videoId, currentTime, duration } = req.body;
    const userId = req.user.id;

    if (!videoId || typeof currentTime !== 'number' || typeof duration !== 'number' || duration <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid input data' });
    }

    const watchedPercentage = (currentTime / duration) * 100;
    console.log(`User ${userId} watching video ${videoId}`);
    console.log(`Current Time: ${currentTime}, Duration: ${duration}, Watched: ${watchedPercentage.toFixed(2)}%`);

    let videoView = await VideoView.findOne({ video_id: videoId, user_id: userId });

    if (!videoView) {
      console.log("Creating new video view record");
      videoView = new VideoView({
        video_id: videoId,
        user_id: userId,
        watchedPercentage
      });
    } else {
      console.log("Existing video view found:", videoView);
      if (watchedPercentage > videoView.watchedPercentage) {
        videoView.watchedPercentage = watchedPercentage;
        console.log("Updated watchedPercentage to:", watchedPercentage.toFixed(2));
      } else {
        console.log("Watched percentage not higher, not updating.");
      }
    }

    // if (watchedPercentage >= 30) {
    //   videoView.isCompleted = true;
    //   console.log("Marking video as completed and updating view count");

    //   await Video.findByIdAndUpdate(videoId, {
    //     $inc: { viewCount: 1}
    //   });
    //   await PlatformStats.updateOne({}, { $inc: { totalViews: 1 } }, { upsert: true });

    //   const videoWithPackage = await Video.findById(videoId).populate('finalPackage_id');
    //   const vendor = await Vendor.findById(videoWithPackage.vendor_id);

    //   if (videoWithPackage?.finalPackage_id) {
    //     const earnings = videoWithPackage.finalPackage_id.pricePerView || 0;

    //     await Vendor.findByIdAndUpdate(videoWithPackage.vendor_id, {
    //       $inc: {
    //         wallet: earnings,
    //         lockedBalance: earnings
    //       }
    //     });

    //     await Video.findByIdAndUpdate(videoId, {
    //       $inc: { totalEarnings: earnings }
    //     });

    //     console.log(`Earnings ${earnings} added to vendor ${vendor?.email}`);
    //   }
    // } else if (videoView.isCompleted) {
    //   console.log("Video already marked as completed, skipping view/earnings update.");
    // }

    
    if (watchedPercentage >= 30 && !videoView.isCompleted) {
      videoView.isCompleted = true;
      console.log("Marking video as completed and updating view count");
    
      await Video.findByIdAndUpdate(videoId, {
        $inc: { viewCount: 1 }
      });
    
      await Vendor.updateOne({}, { $inc: { totalViews: 1 } }, { upsert: true });
    
      const videoWithPackage = await Video.findById(videoId).populate('finalPackage_id');
      const vendor = await Vendor.findById(videoWithPackage.vendor_id);
    
      if (videoWithPackage?.finalPackage_id) {
        const earnings = videoWithPackage.finalPackage_id.pricePerView || 0;
    
        await Vendor.findByIdAndUpdate(videoWithPackage.vendor_id, {
          $inc: {
            wallet: earnings,
            lockedBalance: earnings
          }
        });
    
        await Video.findByIdAndUpdate(videoId, {
          $inc: { totalEarnings: earnings }
        });
    
        console.log(`Earnings ${earnings} added to vendor ${vendor?.email}`);
      }
    } else if (videoView.isCompleted) {
      console.log("Video already marked as completed, skipping view/earnings update.");
    }
    
    await videoView.save();

    res.json({
      success: true,
      message: 'Video progress tracked successfully',
      watchedPercentage: watchedPercentage.toFixed(2)
    });
  } catch (error) {
    console.error("Error tracking video progress:", error);
    res.status(500).json({ success: false, message: 'Error tracking video progress' });
  }
});
// video-url with id 
router.get('/video-url/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    // Choose best available resolution or provide all options
    const videoUrl = video.video_720 || video.video_480 || video.video_320 || '';

    res.json({ success: true, videoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching video' });
  }
});
router.get('/sections', async (req, res) => {
  try {
    const sections = await HomeSection.find()
      // .populate('type_id', 'name')        // Assuming `Type` model has `name`
      // .populate('category_id', 'name')
      // .populate('language_id', 'name')
      // .populate('channel_id', 'name')
      .populate('videos')  // <-- add this if you want video details in GET

      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Sections fetched successfully',
      data: sections
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
router.get('/sections/:typeName', async (req, res) => {
  try {
    const { typeName } = req.params;

    // 🔍 Find Type by name (case-insensitive)
    const type = await Type.findOne({ name: new RegExp(`^${typeName}$`, 'i') });
    if (!type) {
      return res.status(404).json({ message: 'Type not found' });
    }

    // 🧲 Get all home sections with that type_id
    const sections = await HomeSection.find({ type_id: type._id })
      .populate('videos') // optionally populate video details
      .populate('category_id') // optional
      .populate('language_id') // optional
      .populate('channel_id')  // optional
      .sort({ createdAt: -1 }); // recent sections first

    res.status(200).json({
      message: `Found ${sections.length} section(s) for type: ${typeName}`,
      data: sections
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});
router.get('/videos/:id', async (req, res) => {
  const videoId = req.params.id;

  try {
    const video = await Video.findById(videoId)
      .populate('type_id')
      .populate('vendor_id')
      .populate('channel_id')
      .populate('producer_id')
      .populate('category_id')
      .populate('language_id')
      .populate('cast_ids')
      .populate('finalPackage_id')
      .populate('comments')
      .populate('package_id')
      .populate('series_id')
      .populate('season_id')
      .populate('approvedBy');

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    res.status(200).json({ success: true, video });
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// ===== 1. GET CONTEST VIDEOS (Public endpoint) =====
router.get('/contests/:id/videos', async (req, res) => {
  try {
    const contestId = req.params.id;
    const { page = 1, limit = 10, sort = 'latest' } = req.query;
    
    const contest = await Contest
      .findById(contestId)
      .populate('type_id', 'name')
      .select('title description participants status startDate endDate type_id');
    
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    // Check if contest is active or completed (allow viewing both)
    if (!['active', 'completed'].includes(contest.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contest is not available for viewing' 
      });
    }

    // Get contest type and model
    const contestType = contest.type_id.name;
    const modelMap = {
      movie: Video,
      webseries: Series,
      show: TVShow,
      others: Dynamic
    };
    const VideoModel = modelMap[contestType];
    
    if (!VideoModel) {
      return res.status(500).json({ success: false, message: 'Invalid contest type' });
    }

    const videoIds = contest.participants.map(p => p.video_id);
    
    if (videoIds.length === 0) {
      return res.json({
        success: true,
        message: 'No videos in this contest yet',
        data: {
          contest: {
            id: contest._id,
            title: contest.title,
            description: contest.description,
            status: contest.status
          },
          videos: [],
          pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 }
        }
      });
    }

    // Build sort criteria - IMPORTANT: Sort by contest views, not total views
    let sortCriteria = {};
    switch (sort) {
      case 'contest_views': // Most popular in contest
        // We'll sort after getting data since it's in contest schema
        break;
      case 'latest':
      default:
        sortCriteria = { createdAt: -1 };
        break;
    }

    // Get videos with pagination
    const skip = (page - 1) * limit;
    const videos = await VideoModel
      .find({ 
        _id: { $in: videoIds },
        status: 'approved'
      })
      .populate('vendor_id', 'name profile_image')
      .populate('cast_ids', 'name image')
      .populate('category_id', 'name')
      .populate('language_id', 'name')
      .select('name thumbnail landscape description video_duration release_date total_view total_like averageRating ratingCount vendor_id cast_ids category_id language_id createdAt')
      .sort(sortCriteria)
      .skip(sort === 'contest_views' ? 0 : skip)
      .limit(sort === 'contest_views' ? 0 : parseInt(limit));

    // Add contest-specific data and sort by contest views if needed
    let videosWithContestData = videos.map(video => {
      const participant = contest.participants.find(p => p.video_id.equals(video._id));
      return {
        ...video.toObject(),
        contestData: participant ? {
          joinedAt: participant.joinedAt,
          initialViews: participant.initialViews,
          contestViewsOnly: participant.contestViewsOnly || 0,
          adminAdjustedViews: participant.adminAdjustedViews || 0,
          totalContestViews: participant.totalContestViews || 0,
          rank: participant.rank || 0
        } : null
      };
    });

    // Sort by contest views if requested
    if (sort === 'contest_views') {
      videosWithContestData.sort((a, b) => 
        (b.contestData?.totalContestViews || 0) - (a.contestData?.totalContestViews || 0)
      );
      videosWithContestData = videosWithContestData.slice(skip, skip + parseInt(limit));
    }

    const totalVideos = videoIds.length;

    res.json({
      success: true,
      data: {
        contest: {
          id: contest._id,
          title: contest.title,
          description: contest.description,
          status: contest.status,
          startDate: contest.startDate,
          endDate: contest.endDate,
          participantsCount: contest.participants.length
        },
        videos: videosWithContestData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalVideos,
          pages: Math.ceil(totalVideos / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get contest videos error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// // ===== 2. TRACK CONTEST-SPECIFIC VIDEO VIEW =====
// router.post('/contests/:contestId/videos/:videoId/view', async (req, res) => {
//   try {
//     const { contestId, videoId } = req.params;
//     const { source = 'contest' } = req.body;
//     const userId = req.user?.id;
//     const ipAddress = req.ip || req.connection.remoteAddress;
//     const userAgent = req.get('User-Agent');

//     // Only accept views from contest source
//     if (source !== 'contest') {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Invalid view source - must be from contest page' 
//       });
//     }
    
//     const contest = await Contest.findById(contestId).populate('type_id', 'name');
    
//     if (!contest) {
//       return res.status(404).json({ success: false, message: 'Contest not found' });
//     }

//     // Check if contest is active
//     const now = new Date();
//     if (contest.status !== 'active' || now < contest.startDate || now > contest.endDate) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Contest is not currently active' 
//       });
//     }

//     // Find participant
//     const participantIndex = contest.participants.findIndex(p => p.video_id.equals(videoId));
//     if (participantIndex === -1) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Video not found in this contest' 
//       });
//     }

//     const participant = contest.participants[participantIndex];

//     // Check for unique viewer (prevent spam views)
//     const isUniqueView = !participant.uniqueViewers.some(viewer => {
//       if (userId && viewer.userId && viewer.userId.equals(userId)) {
//         // Same user viewed within last 5 minutes
//         const timeDiff = (now - viewer.viewedAt) / (1000 * 60);
//         return timeDiff < 5;
//       }
//       if (!userId && viewer.ipAddress === ipAddress) {
//         // Same IP viewed within last 5 minutes
//         const timeDiff = (now - viewer.viewedAt) / (1000 * 60);
//         return timeDiff < 5;
//       }
//       return false;
//     });

//     if (!isUniqueView) {
//       return res.status(429).json({ 
//         success: false, 
//         message: 'View already counted recently' 
//       });
//     }

//     // Get video model and update total views (for general analytics)
//     const contestType = contest.type_id.name;
//     const modelMap = {
//       movie: Video,
//       webseries: Series,
//       show: TVShow,
//       others: Dynamic
//     };
//     const VideoModel = modelMap[contestType];
    
//     if (!VideoModel) {
//       return res.status(500).json({ success: false, message: 'Invalid contest type' });
//     }

//     // Update video's total views (this remains for general video analytics)
//     const video = await VideoModel.findByIdAndUpdate(
//       videoId,
//       { $inc: { total_view: 1 } },
//       { new: true }
//     );

//     if (!video) {
//       return res.status(404).json({ success: false, message: 'Video not found' });
//     }

//     // Update CONTEST-SPECIFIC views
//     contest.participants[participantIndex].contestViewsOnly += 1;
//     contest.participants[participantIndex].totalContestViews = 
//       contest.participants[participantIndex].contestViewsOnly + 
//       contest.participants[participantIndex].adminAdjustedViews;
    
//     contest.participants[participantIndex].lastViewUpdate = now;

//     // Add unique viewer tracking
//     contest.participants[participantIndex].uniqueViewers.push({
//       userId: userId || null,
//       ipAddress: userId ? null : ipAddress, // Only store IP if no userId
//       viewedAt: now
//     });

//     // Keep only last 100 unique viewers to prevent array from growing too large
//     if (contest.participants[participantIndex].uniqueViewers.length > 100) {
//       contest.participants[participantIndex].uniqueViewers = 
//         contest.participants[participantIndex].uniqueViewers.slice(-100);
//     }

//     await contest.save();

//     res.json({
//       success: true,
//       message: 'Contest view tracked successfully',
//       data: {
//         videoId: videoId,
//         totalVideoViews: video.total_view, // Total views across all sources
//         contestViewsOnly: contest.participants[participantIndex].contestViewsOnly,
//         totalContestViews: contest.participants[participantIndex].totalContestViews,
//         source: source
//       }
//     });

//   } catch (error) {
//     console.error('Track contest view error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });
router.post('/contest/:contestId/video/:videoId/view', async (req, res) => {
  const { contestId, videoId } = req.params;
  const { watchedSeconds } = req.body;
  console.log("hi " + watchedSeconds);
  const userId = req.user?.id || null;
  const ipAddress = req.ip;

  if (!watchedSeconds || watchedSeconds <= 0) {
    return res.status(400).json({ error: 'Invalid watchedSeconds' });
  }

  const contest = await Contest.findById(contestId);
  if (!contest) return res.status(404).json({ error: 'Contest not found' });

  const participant = contest.participants.find(p => p.video_id.equals(videoId));
  if (!participant) return res.status(404).json({ error: 'Video not part of contest' });

  // Correct this line:
  const video = await Video.findById(videoId);
  console.log("this is the video: ", video);

  const totalDuration = video?.video_duration;
  console.log("this is total duration: " + totalDuration);
  if (!totalDuration) return res.status(400).json({ error: 'Video duration not available' });

  // Identify the viewer (by user or IP)
  let viewer = participant.uniqueViewers.find(v =>
    userId ? v.userId?.equals(userId) : v.ipAddress === ipAddress
  );

  if (!viewer) {
    viewer = {
      userId: userId || null,
      ipAddress: userId ? null : ipAddress,
      watchedSeconds,
      counted: false,
      viewedAt: new Date(),
    };
    participant.uniqueViewers.push(viewer);
  } else {
    viewer.watchedSeconds = Math.max(viewer.watchedSeconds || 0, watchedSeconds);
    viewer.viewedAt = new Date();
  }

  const watchedRatio = viewer.watchedSeconds / totalDuration;

  // If 30% watched and not yet counted
  if (watchedRatio >= 0.3 && !viewer.counted) {
    participant.contestViewsOnly += 1;
    participant.totalContestViews = participant.contestViewsOnly + participant.adminAdjustedViews;
    viewer.counted = true;
  }

  await contest.save();
  return res.status(200).json({ message: 'View recorded', counted: viewer.counted });
});
// ➕ Add or Update Rating
router.post('/rate', isUser, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user.id;

    let existing = await AppRating.findOne({ userId });

    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      await existing.save();
      return res.json({ message: 'Rating updated successfully' });
    }

    const newRating = new AppRating({ userId, rating, comment });
    await newRating.save();

    res.status(201).json({ message: 'Rating submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});
// 📥 Get All Ratings (Admin use)
router.get('/ratings', async (req, res) => {
  try {
    const ratings = await AppRating.find().populate('userId', 'name email');
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch ratings', error: err.message });
  }
});
router.get('/series/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid series ID" });
    }

    // Get the series
    const series = await Series.findById(id)
      .populate('vendor_id', 'name email')
      .populate('category_id', 'name')
      .populate('type_id', 'name');

    if (!series) {
      return res.status(404).json({ success: false, message: "Series not found" });
    }

    // Get seasons for this series
    const seasons = await Season.find({ series_id: id }).sort({ seasonNumber: 1 });

    // For each season, fetch related episodes
    const seasonsWithEpisodes = await Promise.all(
      seasons.map(async (season) => {
        const episodes = await Episode.find({ season_id: season._id })
          .sort({ episode_number: 1 })
          .select('-__v -createdAt -updatedAt'); // optional: exclude internal fields

        return {
          ...season.toObject(),
          episodes
        };
      })
    );

    // Final response
    res.json({
      success: true,
      data: {
        ...series.toObject(),
        seasons: seasonsWithEpisodes
      }
    });
  } catch (err) {
    console.error("Error fetching series:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// // tvshows 
router.get('/tv-shows/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Get the TV Show by ID
    const show = await TVShow.findById(id);
    if (!show) return res.status(404).json({ message: 'TV Show not found' });
    console.log("show id ", show);
    // Step 2: Find all seasons of this show
    const seasons = await TVSeason.find({ _id: id });

    // Step 3: For each season, find its episodes
     // Step 3: For each season, find its episodes using season_id

     console.log("this is seaons ", seasons);
    const seasonsWithEpisodes = await Promise.all(
      seasons.map(async (season) => {
        const episodes = await TVEpisode.find({ _id: id });
        return {
          ...season.toObject(),
          episodes,
        };
      })
    );
    // Final response
    return res.json({
      show,
      seasons: seasonsWithEpisodes,
    });
  } catch (err) {
    console.error('Error fetching TV show:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
