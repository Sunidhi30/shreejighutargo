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
// Helper function to get user's active subscription with plan details
async function getUserSubscriptionDetails(userId) {
  const subscription = await UserSubscription.findOne({
    user: userId,
    status: 'active',
    endDate: { $gt: new Date() }
  }).populate('plan');
  
  return subscription;
}
router.post('/profiles', async (req, res) => {
  try {
    const { userId, name, avatar, isKid = false, pin = null, deviceId } = req.body;

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

    // Get user's active subscription
    const subscription = await getUserSubscriptionDetails(userId);
    if (!subscription) {
      return res.status(403).json({ 
        success: false, 
        message: 'No active subscription found. Please subscribe to create profiles.' 
      });
    }

    // Capture device information from request
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const agent = useragent.parse(userAgent);
    const geo = geoip.lookup(ip);

    // Get device information if deviceId is provided
    let deviceInfo = null;
    if (deviceId) {
      deviceInfo = await DeviceSync.findOne({ 
        user_id: userId, 
        device_id: deviceId, 
        status: 1 
      });
    }

    // Create device info object
    const creationDeviceInfo = {
      deviceId: deviceId || null,
      deviceName: deviceInfo ? deviceInfo.device_name : `${agent.family} ${agent.major}`,
      deviceType: deviceInfo ? deviceInfo.device_type : agent.os.family.toLowerCase(),
      ip: ip,
      userAgent: userAgent,
      location: geo ? `${geo.city}, ${geo.country}` : 'Unknown',
      coordinates: geo ? { lat: geo.ll[0], lng: geo.ll[1] } : null,
      timestamp: new Date()
    };

    // Check if profiles array exists, if not create it
    if (!user.profiles) {
      user.profiles = [];
    }

    // Check profile limit based on subscription plan
    const maxProfiles = subscription.plan.maxProfiles || 1;
    if (user.profiles.length >= maxProfiles) {
      return res.status(400).json({ 
        success: false, 
        message: `Your ${subscription.plan.name} plan allows only ${maxProfiles} profile(s). Upgrade your plan to add more profiles.`,
        currentProfiles: user.profiles.length,
        maxAllowed: maxProfiles,
        planName: subscription.plan.name,
        createdFrom: creationDeviceInfo
      });
    }

    // Check if profile name already exists
    const existingProfile = user.profiles.find(profile => 
      profile.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingProfile) {
      return res.status(400).json({ 
        success: false, 
        message: 'Profile name already exists',
        createdFrom: creationDeviceInfo
      });
    }

    const newProfile = {
      _id: new mongoose.Types.ObjectId(),
      name,
      avatar: avatar || 'https://in.bmscdn.com/iedb/artist/images/website/poster/large/pankaj-tripathi-29809-23-03-2017-02-54-29.jpg',
      isKid,
      pin: isKid ? null : pin,
      watchHistory: [],
      preferences: {
        language: user.languagePreference || 'en',
        maturityRating: isKid ? 'G' : 'PG-13'
      },
      myList: [],
      createdAt: new Date(),
      createdFrom: creationDeviceInfo, // Store device info where profile was created
      lastAccessedFrom: creationDeviceInfo // Initial access is from creation device
    };

    user.profiles.push(newProfile);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      profile: newProfile,
      subscription: {
        planName: subscription.plan.name,
        profilesUsed: user.profiles.length,
        maxProfiles: maxProfiles
      },
      deviceInfo: {
        createdFrom: creationDeviceInfo.deviceName,
        deviceType: creationDeviceInfo.deviceType,
        location: creationDeviceInfo.location,
        timestamp: creationDeviceInfo.timestamp
      }
    });

  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
// Get all profiles for a user with subscription info
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

    // Get subscription details
    const subscription = await getUserSubscriptionDetails(userId);
    
    const subscriptionInfo = subscription ? {
      planName: subscription.plan.name,
      maxProfiles: subscription.plan.maxProfiles || 1,
      maxScreens: subscription.plan.maxScreens || 1,
      profilesUsed: user.profiles ? user.profiles.length : 0
    } : null;

    res.status(200).json({
      success: true,
      profiles: user.profiles || [],
      subscription: subscriptionInfo
    });

  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
// Start watching on a device (with screen limit check)
router.post('/devices/start-watching', async (req, res) => {
  try {
    const { userId, deviceId, profileId } = req.body;

    if (!userId || !deviceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and Device ID are required' 
      });
    }

    // Get user's active subscription
    const subscription = await getUserSubscriptionDetails(userId);
    if (!subscription) {
      return res.status(403).json({ 
        success: false, 
        message: 'No active subscription found. Please subscribe to watch content.' 
      });
    }

    // Check current watching devices count
    const currentWatching = await DeviceWatching.countDocuments({ 
      user_id: userId, 
      status: 1 
    });

    const maxScreens = subscription.plan.maxScreens || 1;
    if (currentWatching >= maxScreens) {
      return res.status(429).json({ 
        success: false, 
        message: `Your ${subscription.plan.name} plan allows only ${maxScreens} simultaneous screen(s). Please stop watching on another device first.`,
        currentScreens: currentWatching,
        maxAllowed: maxScreens,
        planName: subscription.plan.name
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

    // Validate profile if provided
    if (profileId) {
      const user = await User.findById(userId);
      const profile = user.profiles.id(profileId);
      if (!profile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Profile not found' 
        });
      }
    }

    // Check if already watching on this device
    let watchingDevice = await DeviceWatching.findOne({ 
      user_id: userId, 
      device_id: deviceId 
    });

    if (watchingDevice) {
      watchingDevice.status = 1;
      watchingDevice.profileId = profileId || watchingDevice.profileId;
      await watchingDevice.save();
    } else {
      watchingDevice = new DeviceWatching({
        user_id: userId,
        device_id: deviceId,
        profileId: profileId,
        status: 1
      });
      await watchingDevice.save();
    }

    res.status(200).json({
      success: true,
      message: 'Started watching on device',
      watchingDevice,
      subscription: {
        planName: subscription.plan.name,
        screensUsed: currentWatching + 1,
        maxScreens: maxScreens
      }
    });

  } catch (error) {
    console.error('Start watching error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
// Get current watching status with limits
router.get('/devices/watching-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get subscription details
    const subscription = await getUserSubscriptionDetails(userId);
    if (!subscription) {
      return res.status(403).json({ 
        success: false, 
        message: 'No active subscription found' 
      });
    }

    // Get currently watching devices
    const watchingDevices = await DeviceWatching.find({ 
      user_id: userId, 
      status: 1 
    }).populate({
      path: 'device_sync',
      select: 'device_name device_type'
    });

    const maxScreens = subscription.plan.maxScreens || 1;
    const currentScreens = watchingDevices.length;

    res.status(200).json({
      success: true,
      data: {
        currentWatching: watchingDevices,
        subscription: {
          planName: subscription.plan.name,
          screensUsed: currentScreens,
          maxScreens: maxScreens,
          availableScreens: Math.max(0, maxScreens - currentScreens)
        },
        canStartWatching: currentScreens < maxScreens
      }
    });

  } catch (error) {
    console.error('Get watching status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
// New API endpoint for selecting a profile and syncing device
router.post('/profiles/select', async (req, res) => {
  try {
    const { userId, profileId, deviceInfo } = req.body;

    if (!userId || !profileId || !deviceInfo) {
      return res.status(400).json({
        success: false,
        message: 'User ID, Profile ID, and device information are required'
      });
    }

    // Get user and validate profile
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

    // Get or create device sync
    let deviceSync = await DeviceSync.findOne({
      user_id: userId,
      device_id: deviceInfo.deviceId
    });

    if (!deviceSync) {
      // Create new device sync
      deviceSync = new DeviceSync({
        user_id: userId,
        device_name: deviceInfo.deviceName,
        device_type: deviceInfo.deviceType,
        device_id: deviceInfo.deviceId,
        device_token: deviceInfo.deviceToken || 'default-token',
        status: 1
      });
      await deviceSync.save();
    } else {
      // Update existing device sync
      deviceSync.status = 1;
      deviceSync.device_name = deviceInfo.deviceName;
      deviceSync.device_type = deviceInfo.deviceType;
      await deviceSync.save();
    }

    // Start watching session
    let watchingDevice = await DeviceWatching.findOne({
      user_id: userId,
      device_id: deviceInfo.deviceId
    });

    if (watchingDevice) {
      watchingDevice.status = 1;
      watchingDevice.profileId = profileId;
      await watchingDevice.save();
    } else {
      watchingDevice = new DeviceWatching({
        user_id: userId,
        device_id: deviceInfo.deviceId,
        profileId: profileId,
        status: 1
      });
      await watchingDevice.save();
    }

    // Update profile's last accessed information
    profile.lastAccessedFrom = {
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType,
      timestamp: new Date()
    };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile selected and device synced successfully',
      profile,
      deviceSync,
      watchingDevice
    });

  } catch (error) {
    console.error('Profile selection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
// Get user subscription dashboard
router.get('/subscription/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('profiles');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const subscription = await getUserSubscriptionDetails(userId);
    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active subscription found' 
      });
    }

    // Get current watching devices
    const currentWatching = await DeviceWatching.countDocuments({ 
      user_id: userId, 
      status: 1 
    });

    // Get synced devices
    const syncedDevices = await DeviceSync.countDocuments({ 
      user_id: userId, 
      status: 1 
    });

    const dashboardData = {
      subscription: {
        planName: subscription.plan.name,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        autoRenew: subscription.autoRenew
      },
      limits: {
        profiles: {
          used: user.profiles ? user.profiles.length : 0,
          max: subscription.plan.maxProfiles || 1,
          available: Math.max(0, (subscription.plan.maxProfiles || 1) - (user.profiles ? user.profiles.length : 0))
        },
        screens: {
          currentlyWatching: currentWatching,
          max: subscription.plan.maxScreens || 1,
          available: Math.max(0, (subscription.plan.maxScreens || 1) - currentWatching)
        },
        devices: {
          synced: syncedDevices
        }
      },
      planFeatures: subscription.plan.features || []
    };

    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });

  } catch (error) {
    console.error('Get subscription dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});
// Update a profile (with subscription validation)
router.put('/profiles/:userId/:profileId', async (req, res) => {
  try {
    const { userId, profileId } = req.params;
    const { name, avatar, pin } = req.body;

    // Check subscription
    const subscription = await getUserSubscriptionDetails(userId);
    if (!subscription) {
      return res.status(403).json({ 
        success: false, 
        message: 'No active subscription found' 
      });
    }

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
// Delete a profile (with subscription validation)
router.delete('/profiles/:userId/:profileId', async (req, res) => {
  try {
    const { userId, profileId } = req.params;

    // Check subscription
    const subscription = await getUserSubscriptionDetails(userId);
    if (!subscription) {
      return res.status(403).json({ 
        success: false, 
        message: 'No active subscription found' 
      });
    }

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
      message: 'Profile deleted successfully',
      remainingProfiles: user.profiles.length
    });

  } catch (error) {
    console.error('Delete profile error:', error);
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

    const result = await DeviceWatching.findOneAndUpdate(
      { user_id: userId, device_id: deviceId },
      { status: 0 },
      { new: true }
    );

    // Get updated watching count
    const currentWatching = await DeviceWatching.countDocuments({ 
      user_id: userId, 
      status: 1 
    });

    // Get subscription for screen info
    const subscription = await getUserSubscriptionDetails(userId);
    const maxScreens = subscription ? (subscription.plan.maxScreens || 1) : 1;

    res.status(200).json({
      success: true,
      message: 'Stopped watching on device',
      currentScreens: currentWatching,
      availableScreens: Math.max(0, maxScreens - currentWatching)
    });

  } catch (error) {
    console.error('Stop watching error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// // Get all existing routes with minor enhancements
// router.get('/api/user/:id/login-info', async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select('lastLogin email role');
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

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

// // Enhanced device routes with existing functionality
// router.get('/devices/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const user = await User.findById(userId).select('deviceSessions lastLogin');
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     const syncedDevices = await DeviceSync.find({ 
//       user_id: userId, 
//       status: 1 
//     }).select('device_name device_type device_id createdAt');

//     const watchingDevices = await DeviceWatching.find({ 
//       user_id: userId, 
//       status: 1 
//     }).populate({
//       path: 'device_sync',
//       select: 'device_name device_type'
//     });

//     const devicesInfo = {
//       lastLogin: user.lastLogin,
//       activeSessions: user.deviceSessions || [],
//       syncedDevices: syncedDevices,
//       currentlyWatching: watchingDevices
//     };

//     res.status(200).json({
//       success: true,
//       devices: devicesInfo
//     });

//   } catch (error) {
//     console.error('Get devices error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error' 
//     });
//   }
// });



// // get the login information places 
// router.get('/api/user/:id/login-info', async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select('lastLogin email role');
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });
// // Get location data for all users
// router.get('/user-locations', async (req, res) => {
//   try {
//     const users = await User.find({}, {
//       email: 1,
//       'lastLogin.location': 1,
//       'lastLogin.coordinates': 1,
//       'lastLogin.ip': 1,
//       'lastLogin.device': 1,
//       'lastLogin.time': 1,
//     });

//     res.status(200).json({ users });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to fetch user locations', error: err.message });
//   }
// });
// // Create a new profile for user
// router.post('/profiles', async (req, res) => {
//   try {
//     const { userId, name, avatar, isKid = false, pin = null } = req.body;

//     if (!userId || !name) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'User ID and profile name are required' 
//       });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     // Check if profiles array exists, if not create it
//     if (!user.profiles) {
//       user.profiles = [];
//     }

//     // Check profile limit (Netflix allows 5 profiles)
//     if (user.profiles.length >= 5) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Maximum 5 profiles allowed per account' 
//       });
//     }

//     // Check if profile name already exists
//     const existingProfile = user.profiles.find(profile => 
//       profile.name.toLowerCase() === name.toLowerCase()
//     );
    
//     if (existingProfile) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Profile name already exists' 
//       });
//     }

//     const newProfile = {
//       _id: new mongoose.Types.ObjectId(),
//       name,
//       avatar: avatar || 'default-avatar.png',
//       isKid,
//       pin: isKid ? null : pin, // Kids profiles don't need PIN
//       watchHistory: [],
//       preferences: {
//         language: user.languagePreference || 'en',
//         maturityRating: isKid ? 'G' : 'R'
//       },
//       createdAt: new Date()
//     };

//     user.profiles.push(newProfile);
//     await user.save();

//     res.status(201).json({
//       success: true,
//       message: 'Profile created successfully',
//       profile: newProfile
//     });

//   } catch (error) {
//     console.error('Create profile error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error' 
//     });
//   }
// });
// // Get all profiles for a user
// router.get('/profiles/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const user = await User.findById(userId).select('profiles');
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     res.status(200).json({
//       success: true,
//       profiles: user.profiles || []
//     });

//   } catch (error) {
//     console.error('Get profiles error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error' 
//     });
//   }
// });
// // Update a profile
// router.put('/profiles/:userId/:profileId', async (req, res) => {
//   try {
//     const { userId, profileId } = req.params;
//     const { name, avatar, pin } = req.body;

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     const profile = user.profiles.id(profileId);
//     if (!profile) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Profile not found' 
//       });
//     }

//     // Check if new name already exists in other profiles
//     if (name && name !== profile.name) {
//       const existingProfile = user.profiles.find(p => 
//         p._id.toString() !== profileId && 
//         p.name.toLowerCase() === name.toLowerCase()
//       );
      
//       if (existingProfile) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'Profile name already exists' 
//         });
//       }
//       profile.name = name;
//     }

//     if (avatar) profile.avatar = avatar;
//     if (pin !== undefined && !profile.isKid) profile.pin = pin;

//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: 'Profile updated successfully',
//       profile
//     });

//   } catch (error) {
//     console.error('Update profile error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error' 
//     });
//   }
// });
// router.delete('/profiles/:userId/:profileId', async (req, res) => {
//   try {
//     const { userId, profileId } = req.params;

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     const profile = user.profiles.id(profileId);
//     if (!profile) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Profile not found' 
//       });
//     }

//     // Don't allow deletion if it's the last profile
//     if (user.profiles.length === 1) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Cannot delete the last profile' 
//       });
//     }

//     user.profiles.pull(profileId);
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: 'Profile deleted successfully'
//     });

//   } catch (error) {
//     console.error('Delete profile error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error' 
//     });
//   }
// });
// Get all connected devices for a user
// router.get('/devices/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // Get user with device sessions
//     const user = await User.findById(userId).select('deviceSessions lastLogin');
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     // Get synced devices
//     const syncedDevices = await DeviceSync.find({ 
//       user_id: userId, 
//       status: 1 
//     }).select('device_name device_type device_id createdAt');

//     // Get currently watching devices
//     const watchingDevices = await DeviceWatching.find({ 
//       user_id: userId, 
//       status: 1 
//     }).populate({
//       path: 'device_sync',
//       select: 'device_name device_type'
//     });

//     // Combine device information
//     const devicesInfo = {
//       lastLogin: user.lastLogin,
//       activeSessions: user.deviceSessions || [],
//       syncedDevices: syncedDevices,
//       currentlyWatching: watchingDevices
//     };

//     res.status(200).json({
//       success: true,
//       devices: devicesInfo
//     });

//   } catch (error) {
//     console.error('Get devices error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error' 
//     });
//   }
// });
// // Add/Sync a new device
// router.post('/devices/sync', async (req, res) => {
//   try {
//     const { 
//       userId, 
//       deviceName, 
//       deviceType, 
//       deviceToken, 
//       deviceId 
//     } = req.body;

//     if (!userId || !deviceName || !deviceType || !deviceToken || !deviceId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'All device fields are required' 
//       });
//     }

//     // Check if device already exists
//     const existingDevice = await DeviceSync.findOne({ 
//       user_id: userId, 
//       device_id: deviceId 
//     });

//     if (existingDevice) {
//       // Update existing device
//       existingDevice.device_name = deviceName;
//       existingDevice.device_type = deviceType;
//       existingDevice.device_token = deviceToken;
//       existingDevice.status = 1;
//       await existingDevice.save();

//       return res.status(200).json({
//         success: true,
//         message: 'Device updated successfully',
//         device: existingDevice
//       });
//     }

//     // Create new device sync
//     const newDevice = new DeviceSync({
//       user_id: userId,
//       device_name: deviceName,
//       device_type: deviceType,
//       device_token: deviceToken,
//       device_id: deviceId
//     });

//     await newDevice.save();

//     // Get user IP and location info
//     const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//     const userAgent = req.headers['user-agent'];
//     const agent = useragent.parse(userAgent);
//     const geo = geoip.lookup(ip);

//     // Update user's device sessions
//     const user = await User.findById(userId);
//     if (user) {
//       const sessionInfo = {
//         ip: ip,
//         device: `${agent.family} ${agent.major} on ${agent.os.family}`,
//         location: geo ? `${geo.city}, ${geo.country}` : 'Unknown',
//         coordinates: geo ? { lat: geo.ll[0], lng: geo.ll[1] } : null,
//         time: new Date()
//       };

//       // Update last login
//       user.lastLogin = sessionInfo;

//       // Add to device sessions (keep last 10 sessions)
//       if (!user.deviceSessions) user.deviceSessions = [];
//       user.deviceSessions.unshift(sessionInfo);
//       if (user.deviceSessions.length > 10) {
//         user.deviceSessions = user.deviceSessions.slice(0, 10);
//       }

//       await user.save();
//     }

//     res.status(201).json({
//       success: true,
//       message: 'Device synced successfully',
//       device: newDevice
//     });

//   } catch (error) {
//     console.error('Sync device error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error' 
//     });
//   }
// });
// // Remove/Unsync a device
// router.delete('/devices/:userId/:deviceId', async (req, res) => {
//   try {
//     const { userId, deviceId } = req.params;

//     // Remove from device sync
//     const device = await DeviceSync.findOneAndUpdate(
//       { user_id: userId, device_id: deviceId },
//       { status: 0 },
//       { new: true }
//     );

//     if (!device) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Device not found' 
//       });
//     }

//     // Also remove from watching devices
//     await DeviceWatching.findOneAndUpdate(
//       { user_id: userId, device_id: deviceId },
//       { status: 0 }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Device removed successfully'
//     });

//   } catch (error) {
//     console.error('Remove device error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error' 
//     });
//   }
// });
// // Start watching on a device
// router.post('/devices/start-watching', async (req, res) => {
//   try {
//     const { userId, deviceId } = req.body;

//     if (!userId || !deviceId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'User ID and Device ID are required' 
//       });
//     }

//     // Check if device is synced
//     const syncedDevice = await DeviceSync.findOne({ 
//       user_id: userId, 
//       device_id: deviceId, 
//       status: 1 
//     });

//     if (!syncedDevice) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Device not synced or not found' 
//       });
//     }

//     // Check if already watching on this device
//     let watchingDevice = await DeviceWatching.findOne({ 
//       user_id: userId, 
//       device_id: deviceId 
//     });

//     if (watchingDevice) {
//       watchingDevice.status = 1;
//       await watchingDevice.save();
//     } else {
//       watchingDevice = new DeviceWatching({
//         user_id: userId,
//         device_id: deviceId,
//         status: 1
//       });
//       await watchingDevice.save();
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Started watching on device',
//       watchingDevice
//     });

//   } catch (error) {
//     console.error('Start watching error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error' 
//     });
//   }
// });
// // Stop watching on a device
// router.post('/devices/stop-watching', async (req, res) => {
//   try {
//     const { userId, deviceId } = req.body;

//     await DeviceWatching.findOneAndUpdate(
//       { user_id: userId, device_id: deviceId },
//       { status: 0 }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Stopped watching on device'
//     });

//   } catch (error) {
//     console.error('Stop watching error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Internal server error' 
//     });
//   }
// });
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
// router.post('/connect_tv', async (req, res) => {
//   const { code, user_id, device_id } = req.body;
//   try {
//     const tvLogin = await TvLogin.findOne({ unique_code: code, user_id });

//     if (!tvLogin) {
//       return res.status(400).json({ success: false, message: 'Invalid code or user ID' });
//     }

//     // If device_token not provided, generate it
//     const deviceToken = crypto.randomBytes(16).toString('hex');

//     const newDevice = new DeviceSync({
//       user_id,
//       device_name: 'TV Device',
//       device_id,
//       device_type: 3,
//       device_token: deviceToken,
//       tv_login_id: tvLogin._id
//     });

//     await newDevice.save();

//     return res.status(200).json({
//       success: true,
//       message: 'TV connected successfully',
//       device_token: deviceToken // <-- send it back
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ success: false, message: 'Failed to connect TV' });
//   }
// });
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
// router.post('/confirm', async (req, res) => {
//   const { code, user_id } = req.body;
//   if (!code || !user_id) return res.status(400).json({ success: false, message: 'Code and user_id are required' });

//   try {
//     const tvLogin = await TvLogin.findOneAndUpdate(
//       { unique_code: code, status: 1 },
//       { user_id },
//       { new: true }
//     );

//     if (!tvLogin) return res.status(404).json({ success: false, message: 'Invalid or expired code' });

//     res.json({ success: true, message: 'TV linked successfully' });
//   } catch (err) {
//     res.status(500).json({ success: false });
//   }
// });

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


// testing  for conitnue watching 
// router.post('/continue-watching', isUser,async (req, res) => {
//   const {videoId, progress, contentType } = req.body;
//     const userId = req.user.id;
//   if (!userId || !videoId || !contentType) {
//     return res.status(400).json({ message: 'Missing required fields' });
//   }

//   try {
//     const existing = await ContinueWatching.findOne({ userId, videoId, contentType });

//     if (existing) {
//       existing.progress = progress;
//       existing.updatedAt = Date.now();
//       await existing.save();
//     } else {
//       await ContinueWatching.create({ userId, videoId, contentType, progress });
//     }

//     res.json({ message: 'Progress saved' });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to save progress', error: error.message });
//   }
// });
// router.get('/continue-watching', isUser, async (req, res) => {
//   const userId = req.user._id;

//   try {
//     const list = await ContinueWatching.find({ userId })
//       .sort({ updatedAt: -1 })
//       .populate({
//         path: 'videoId',
//         populate: {
//           path: 'seasonId seriesId tvshowId', // Populate nested refs if needed
//           select: 'title name'
//         }
//       });

//     res.json({
//       message: 'Continue Watching list fetched successfully',
//       data: list
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: 'Failed to fetch list',
//       error: error.message
//     });
//   }
// });
// Continue Watching Schema



// POST API to save watching progress
// router.post('/continue-watching', isUser, async (req, res) => {
//   const { 
//     contentId, 
//     progress, 
//     contentType,
//     seriesId,
//     seasonId,
//     tvShowId,
//     tvSeasonId 
//   } = req.body;
//   const userId = req.user._id;

//   try {
//     // Map content type to model name
//     const contentModelMap = {
//       'movie': 'Movie',
//       'series': 'Series',
//       'tvshow': 'TVShow',
//       'episode': 'Episode',
//       'tvepisode': 'TVEpisode'
//     };

//     const contentModel = contentModelMap[contentType?.toLowerCase()];
//     if (!contentModel) {
//       return res.status(400).json({
//         message: 'Invalid content type. Supported types: movie, series, tvshow, episode, tvepisode'
//       });
//     }

//     // Build update data
//     const updateData = {
//       progress,
//       contentModel,
//       lastWatchedAt: Date.now()
//     };

//     // Add parent references for episodes
//     if (contentModel === 'Episode') {
//       if (!seriesId || !seasonId) {
//         return res.status(400).json({
//           message: 'Series and season IDs are required for episodes'
//         });
//       }
//       updateData.seriesId = seriesId;
//       updateData.seasonId = seasonId;
//     }

//     if (contentModel === 'TVEpisode') {
//       if (!tvShowId || !tvSeasonId) {
//         return res.status(400).json({
//           message: 'TV Show and TV season IDs are required for TV episodes'
//         });
//       }
//       updateData.tvShowId = tvShowId;
//       updateData.tvSeasonId = tvSeasonId;
//     }

//     // Update or create continue watching entry
//     const updated = await ContinueWatching.findOneAndUpdate(
//       { userId, contentId },
//       updateData,
//       {
//         new: true,
//         upsert: true
//       }
//     );

//     res.json({
//       message: 'Progress saved successfully',
//       data: updated
//     });

//   } catch (error) {
//     res.status(500).json({
//       message: 'Failed to save progress',
//       error: error.message
//     });
//   }
// });

// GET API to fetch continue watching list
// Continue Watching Schema

// POST API to save watching progress
// Continue Watching Schema remains mostly the same

// POST API to save watching progress
// Continue Watching Schema


// POST API to save watching progress
router.post('/continue-watching', isUser, async (req, res) => {
  const { contentId, video_type, progress } = req.body;
  const userId = req.user._id;

  try {
    let content;
    
    // Find content based on video_type
    switch(video_type) {
      case 'movie':
        content = await Video.findById(contentId);
        break;
      
      case 'series':
        // First check if it's an episode
        content = await Episode.findById(contentId)
          .populate('series_id')
          .populate('season_id');
        if (!content) {
          // If not an episode, check if it's a series
          content = await Series.findById(contentId);
        }
        break;
      
      case 'show':
        // First check if it's a TV episode
        content = await TVEpisode.findById(contentId)
          .populate('tvshow_id')
          .populate('tvseason_id');
        if (!content) {
          // If not an episode, check if it's a show
          content = await TVShow.findById(contentId);
        }
        break;
      
      default:
        return res.status(400).json({ message: 'Invalid video type' });
    }

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Update or create continue watching entry
    const updated = await ContinueWatching.findOneAndUpdate(
      { userId, contentId },
      {
        video_type,
        progress,
        lastWatchedAt: Date.now()
      },
      { new: true, upsert: true }
    );

    res.json({
      message: 'Progress saved successfully',
      data: updated
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to save progress',
      error: error.message
    });
  }
});

// GET API to fetch continue watching list
// GET API to fetch continue watching list
// router.get('/continue-watching', isUser, async (req, res) => {
//   const userId = req.user._id;
// console.log("this is user id ",userId);
//   try {
//     const list = await ContinueWatching.find({ userId })
//       .sort({ lastWatchedAt: -1 });
//     console.log("this is list ",list);
//     const formattedList = await Promise.all(list.map(async (item) => {
//       let contentDetails = {
//         title: '',
//         thumbnail: '',
//         duration: 0
//       };

//       try {
//         // Get content details based on video_type
//         switch(item.video_type) {
//           case 'movie':
//             const movie = await Video.findById(item.contentId);
//             if (movie) {
//               contentDetails = {
//                 title: movie.title || '',
//                 thumbnail: movie.thumbnail || '',
//                 duration: movie.duration || 0
//               };
//             }
//             break;

//           case 'series':
//             // First check if it's an episode
//             const episode = await Episode.findById(item.contentId)
//               .populate('series_id')
//               .populate('season_id');

//             if (episode && episode.series_id && episode.season_id) {
//               contentDetails = {
//                 title: episode.title || '',
//                 thumbnail: episode.thumbnail || '',
//                 duration: episode.duration || 0,
//                 series: {
//                   title: episode.series_id.title || '',
//                   season: {
//                     name: episode.season_id.name || '',
//                     number: episode.season_id.number || 0
//                   }
//                 }
//               };
//             } else {
//               // Check if it's a series
//               const series = await Series.findById(item.contentId);
//               if (series) {
//                 contentDetails = {
//                   title: series.title || '',
//                   thumbnail: series.thumbnail || ''
//                 };
//               }
//             }
//             break;

//           case 'show':
//             // First check if it's a TV episode
//             const tvEpisode = await TVEpisode.findById(item.contentId)
//               .populate('tvshow_id')
//               .populate('tvseason_id');

//             if (tvEpisode && tvEpisode.tvshow_id && tvEpisode.tvseason_id) {
//               contentDetails = {
//                 title: tvEpisode.title || '',
//                 thumbnail: tvEpisode.thumbnail || '',
//                 duration: tvEpisode.duration || 0,
//                 show: {
//                   title: tvEpisode.tvshow_id.title || '',
//                   season: {
//                     name: tvEpisode.tvseason_id.name || '',
//                     number: tvEpisode.tvseason_id.number || 0
//                   }
//                 }
//               };
//             } else {
//               // Check if it's a show
//               const show = await TVShow.findById(item.contentId);
//               if (show) {
//                 contentDetails = {
//                   title: show.title || '',
//                   thumbnail: show.thumbnail || ''
//                 };
//               }
//             }
//             break;
//         }

//         return {
//           id: item._id,
//           contentId: item.contentId,
//           video_type: item.video_type,
//           progress: item.progress,
//           lastWatchedAt: item.lastWatchedAt,
//           content: contentDetails
//         };
//       } catch (err) {
//         console.error(`Error processing content ${item.contentId}:`, err);
//         return null;
//       }
//     }));

//     // Filter out any null entries and empty titles
//     const validList = formattedList.filter(item => 
//       item && item.content && item.content.title
//     );

//     res.json({
//       message: 'Continue watching list fetched successfully',
//       data: validList
//     });

//   } catch (error) {
//     console.error('Error fetching continue watching list:', error);
//     res.status(500).json({
//       message: 'Failed to fetch continue watching list',
//       error: error.message
//     });
//   }
// });
// router.get('/good-continue-watching', isUser, async (req, res) => {
//   const userId = req.user._id;
//   console.log("this is user id ", userId);

//   try {
//     const list = await ContinueWatching.find({ userId })
//       .sort({ lastWatchedAt: -1 });
//     console.log("this is list ", list);

//     const formattedList = await Promise.all(list.map(async (item) => {
//       try {
//         // First, find the content regardless of type
//         const content = await Promise.all([
//           Video.findById(item.contentId),
//           Series.findById(item.contentId),
//           Episode.findById(item.contentId).populate('show_id season_id'),
//           TVShow.findById(item.contentId),
//           TVEpisode.findById(item.contentId).populate('tvshow_id tvseason_id')
//         ]);

//         // Find the first non-null result
//         const foundContent = content.find(c => c !== null);
//         console.log("Found content:", foundContent);

//         if (!foundContent) {
//           console.log("No content found for ID:", item.contentId);
//           return null;
//         }

//         // Determine content type and format details based on the content structure
//         let contentDetails = {
//           title: '',
//           thumbnail: '',
//           duration: 0
//         };

//         // Check content structure to determine its type
//         if (foundContent.show_id) {
//           // It's a TV Episode
//           contentDetails = {
//             title: foundContent.title || '',
//             thumbnail: foundContent.thumbnail || '',
//             duration: foundContent.video_duration || 0,
//             type: 'episode',
//             show: {
//               title: foundContent.show_id?.title || '',
//               season: foundContent.season_id ? {
//                 name: foundContent.season_id.name || '',
//                 number: foundContent.season_id.number || 0
//               } : null
//             }
//           };
//         } else if (foundContent.tvshow_id) {
//           // It's a TV Show Episode
//           contentDetails = {
//             title: foundContent.title || '',
//             thumbnail: foundContent.thumbnail || '',
//             duration: foundContent.duration || 0,
//             type: 'tvepisode',
//             show: {
//               title: foundContent.tvshow_id?.title || '',
//               season: foundContent.tvseason_id ? {
//                 name: foundContent.tvseason_id.name || '',
//                 number: foundContent.tvseason_id.number || 0
//               } : null
//             }
//           };
//         } else if (foundContent.seasons) {
//           // It's a Series
//           contentDetails = {
//             title: foundContent.title || '',
//             thumbnail: foundContent.thumbnail || '',
//             type: 'series'
//           };
//         } else if (foundContent.episodes) {
//           // It's a TV Show
//           contentDetails = {
//             title: foundContent.title || '',
//             thumbnail: foundContent.thumbnail || '',
//             type: 'show'
//           };
//         } else {
//           // It's a Movie
//           contentDetails = {
//             title: foundContent.title || '',
//             thumbnail: foundContent.thumbnail || '',
//             duration: foundContent.video_duration || 0,
//             type: 'movie'
//           };
//         }

//         console.log("Formatted content details:", contentDetails);

//         return {
//           id: item._id,
//           contentId: item.contentId,
//           video_type: contentDetails.type,
//           progress: item.progress,
//           lastWatchedAt: item.lastWatchedAt,
//           content: contentDetails
//         };
//       } catch (err) {
//         console.error(`Error processing content ${item.contentId}:`, err);
//         return null;
//       }
//     }));

//     // Filter out any null entries and empty titles
//     const validList = formattedList.filter(item => 
//       item && item.content && item.content.title
//     );

//     console.log("Final valid list:", validList);

//     res.json({
//       message: 'Continue watching list fetched successfully',
//       data: validList
//     });

//   } catch (error) {
//     console.error('Error fetching continue watching list:', error);
//     res.status(500).json({
//       message: 'Failed to fetch continue watching list',
//       error: error.message
//     });
//   }
// });
router.get('/continue-watching', isUser, async (req, res) => {
  const userId = req.user._id;
  console.log("this is user id ", userId);

  try {
    const list = await ContinueWatching.find({ userId })
      .sort({ lastWatchedAt: -1 });
    console.log("this is list ", list);

    const formattedList = await Promise.all(list.map(async (item) => {
      try {
        // Use the video_type from the ContinueWatching document to determine which model to query
        let foundContent;
        const videoType = item.video_type || item.contentModel?.toLowerCase() || 'series'; // fallback to 'series' if undefined

        console.log(`Searching for content with ID ${item.contentId} of type ${videoType}`);

        switch(videoType) {
          case 'series':
            foundContent = await Series.findById(item.contentId)
              .populate('category_id', 'name')
              .populate('language_id', 'name')
              .populate('vendor_id', 'name');
            break;
          case 'movie':
            foundContent = await Video.findById(item.contentId)
              .populate('category_id', 'name')
              .populate('language_id', 'name')
              .populate('vendor_id', 'name');
            break;
          case 'show':
            foundContent = await mongoose.model('tvShowSchema').findById(item.contentId)
              .populate('category_id', 'name')
              .populate('language_id', 'name')
              .populate('vendor_id', 'name');
            break;
          default:
            console.log(`Unknown video type: ${videoType}`);
            return null;
        }

        console.log("Found content:", foundContent);

        if (!foundContent) {
          console.log("No content found for ID:", item.contentId);
          return null;
        }

        // Format content details based on what was found
        const contentDetails = {
          title: foundContent.title || '',
          thumbnail: foundContent.thumbnail || '',
          type: videoType,
          duration: foundContent.video_duration || foundContent.duration || 0,
          // Add additional fields if needed
          category: foundContent.category_id?.name || '',
          language: foundContent.language_id?.name || '',
          vendor: foundContent.vendor_id?.name || ''
        };

        return {
          id: item._id,
          contentId: item.contentId,
          video_type: videoType,
          progress: item.progress,
          lastWatchedAt: item.lastWatchedAt,
          content: contentDetails
        };
      } catch (err) {
        console.error(`Error processing content ${item.contentId}:`, err);
        return null;
      }
    }));

    // Filter out any null entries and empty titles
    const validList = formattedList.filter(item => 
      item && item.content && item.content.title
    );

    console.log("Final valid list:", validList);

    res.json({
      message: 'Continue watching list fetched successfully',
      data: validList
    });

  } catch (error) {
    console.error('Error fetching continue watching list:', error);
    res.status(500).json({
      message: 'Failed to fetch continue watching list',
      error: error.message
    });
  }
});
// DELETE API to remove from continue watching
router.delete('/continue-watching/:id', isUser, async (req, res) => {
  const userId = req.user._id;
  const itemId = req.params.id;

  try {
    const deleted = await ContinueWatching.findOneAndDelete({
      _id: itemId,
      userId
    });

    if (!deleted) {
      return res.status(404).json({
        message: 'Continue watching item not found'
      });
    }

    res.json({
      message: 'Item removed from continue watching',
      data: deleted
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to remove item',
      error: error.message
    });
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
//search 
// router.get('/search', async (req, res) => {
//   const { name } = req.query;

//   try {
//     // If `name` exists, search by it; otherwise fetch all movies
//     const filter = name
//       ? { name: { $regex: name, $options: 'i' } }
//       : {};

//     const videos = await Video.find(filter)
//       .populate('category_id', 'name')
//       .populate('cast_ids', 'name')
//       .populate('language_id', 'name')
//       .populate('producer_id', 'name')
//       .populate('vendor_id', 'name');

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
    const filter = name
      ? { name: { $regex: name, $options: 'i' } }
      : {};
      const seriesFilter = name
      ? { title: { $regex: name, $options: 'i' } }
      : {};
      const showFilter = name
      ? { title: { $regex: name, $options: 'i' } }
      : {};
    // Run all 3 queries in parallel
   
    const [videos, series, tvshows] = await Promise.all([
      Video.find(filter)
        .populate('category_id', 'name')
        .populate('cast_ids', 'name')
        .populate('language_id', 'name')
        .populate('producer_id', 'name')
        .populate('vendor_id', 'name'),

      Series.find(seriesFilter)
        .populate('category_id', 'name')

        
        .populate('vendor_id', 'name'),

      TVShow.find(showFilter)
        .populate('category_id', 'name')
        .populate('vendor_id', 'name'),
    ]);

    const allResults = [
      ...videos.map(item => ({ ...item.toObject(), type: 'movie' })),
      ...series.map(item => ({ ...item.toObject(), type: 'series' })),
      ...tvshows.map(item => ({ ...item.toObject(), type: 'tvshow' })),
    ];

    res.status(200).json({
      success: true,
      total: allResults.length,
      results: allResults
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
//get all  contests
router.get('/contests', async (req, res) => {
  try {
    const contests = await Contest.find()
      .populate('type_id', 'name') // populates type name
      .populate('registrations.vendor_id', 'fullName email') // basic vendor info
      .populate('registrations.video_id', 'title') // basic video info
      .populate('participants.vendor_id', 'fullName email')
      .populate('participants.video_id', 'title')
      .populate('viewsUpdateHistory.vendor_id', 'fullName')
      .populate('viewsUpdateHistory.video_id', 'title')
      .populate('createdBy', 'fullName email');

    res.status(200).json({
      message: 'Contests fetched successfully',
      total: contests.length,
      data: contests,
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
    res.status(500).json({ message: 'Server error while fetching contests' });
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
    // if (!['active'].includes(contest.status)) {
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: 'Contest is not available for viewing' 
    //   });
    // }

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
      .select('name thumbnail landscape description video_duration  video_320  video_480   video_720  video_1080 release_date total_view total_like averageRating ratingCount vendor_id cast_ids category_id language_id createdAt')
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
// 1. NEW ENDPOINT: Get available plans (including upgrades)
// router.get('/available-plans', isUser, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // 1. Get current active subscription
//     const currentSubscription = await UserSubscription.findOne({
//       user: userId,
//       status: 'active',
//       endDate: { $gt: new Date() }
//     }).populate('plan');

//     // 2. No active subscription → Show all plans
//     if (!currentSubscription) {
//       const allPlans = await SubscriptionPlan.find({ isActive: true });

//       return res.status(200).json({
//         success: true,
//         hasActiveSubscription: false,
//         message: 'No active subscription. All plans available.',
//         availablePlans: allPlans.map(plan => ({
//           id: plan._id,
//           name: plan.name,
//           price: plan.price,
//           duration: plan.duration,
//           maxDevices: plan.maxDevices,
//           maxProfiles: plan.maxProfiles,
//           description: plan.description,
//           action: 'new_subscription',
//           badge: 'Available'
//         }))
//       });
//     }

//     // 3. Active subscription → Fetch higher priced plans only
//     const currentPlanId = currentSubscription.plan._id;
//     const currentPlanPrice = Number(currentSubscription.plan.price);
//     console.log("plan price ", currentPlanPrice);


//     const upgradePlans = await SubscriptionPlan.find({
//       isActive: true,
//       _id: { $ne: currentPlanId },
//       price: { $gt: currentPlanPrice }
//     });

//     const daysRemaining = Math.ceil(
//       (currentSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24)
//     );

//     // ✅ Condition: Only respond with upgrades if they exist
//     if (!upgradePlans.length) {
//       return res.status(200).json({
//         success: true,
//         hasActiveSubscription: true,
//         message: 'No higher-priced plans available for upgrade.',
//         currentPlan: {
//           id: currentPlanId,
//           name: currentSubscription.plan.name,
//           price: currentPlanPrice,
//           daysRemaining,
//           endDate: currentSubscription.endDate,
//           status: currentSubscription.status
//         },
//         availablePlans: []
//       });
//     }

//     // 4. Return available upgrades
//     res.status(200).json({
//       success: true,
//       hasActiveSubscription: true,
//       message: 'Current subscription found. Available upgrades:',
//       currentPlan: {
//         id: currentPlanId,
//         name: currentSubscription.plan.name,
//         price: currentPlanPrice,
//         daysRemaining,
//         endDate: currentSubscription.endDate,
//         status: currentSubscription.status
//       },
//       availablePlans: upgradePlans.map(plan => ({
//         id: plan._id,
//         name: plan.name,
//         price: plan.price,
//         duration: plan.duration,
//         maxDevices: plan.maxDevices,
//         maxProfiles: plan.maxProfiles,
//         description: plan.description,
//         action: 'upgrade',
//         badge: 'Upgrade',
//         priceDifference: plan.price - currentPlanPrice
//       }))
//     });

//   } catch (error) {
//     console.error('Get available plans error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching available plans',
//       error: error.message
//     });
//   }
// });
router.get('/available-plans', isUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get current active subscription
    const currentSubscription = await UserSubscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('plan');

    // 2. No active subscription → Show all plans with currentPlan as null
    if (!currentSubscription) {
      const allPlans = await SubscriptionPlan.find({ isActive: true });

      return res.status(200).json({
        success: true,
        hasActiveSubscription: false,
        message: 'No active subscription. All plans available.',
        currentPlan: null,
        availablePlans: allPlans.map(plan => ({
          id: plan._id,
          name: plan.name,
          price: plan.price,
          duration: plan.duration,
          maxDevices: plan.maxDevices,
          maxProfiles: plan.maxProfiles,
          description: plan.description,
          action: 'new_subscription',
          badge: 'Available'
        }))
      });
    }

    // 3. Active subscription → Fetch higher priced plans only
    const currentPlanId = currentSubscription.plan._id;
    const currentPlanPrice = Number(currentSubscription.plan.price);

    const upgradePlans = await SubscriptionPlan.find({
      isActive: true,
      _id: { $ne: currentPlanId },
      price: { $gt: currentPlanPrice }
    });

    const daysRemaining = Math.ceil(
      (currentSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24)
    );

    // 4. No higher priced plans
    if (!upgradePlans.length) {
      return res.status(200).json({
        success: true,
        hasActiveSubscription: true,
        message: 'No higher-priced plans available for upgrade.',
        currentPlan: {
          id: currentPlanId,
          name: currentSubscription.plan.name,
          price: currentPlanPrice,
          daysRemaining,
          endDate: currentSubscription.endDate,
          status: currentSubscription.status
        },
        availablePlans: []
      });
    }

    // 5. Return upgrade plans
    res.status(200).json({
      success: true,
      hasActiveSubscription: true,
      message: 'Current subscription found. Available upgrades:',
      currentPlan: {
        id: currentPlanId,
        name: currentSubscription.plan.name,
        price: currentPlanPrice,
        daysRemaining,
        endDate: currentSubscription.endDate,
        status: currentSubscription.status
      },
      availablePlans: upgradePlans.map(plan => ({
        id: plan._id,
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        maxDevices: plan.maxDevices,
        maxProfiles: plan.maxProfiles,
        description: plan.description,
        action: 'upgrade',
        badge: 'Upgrade',
        priceDifference: plan.price - currentPlanPrice
      }))
    });

  } catch (error) {
    console.error('Get available plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available plans',
      error: error.message
    });
  }
});
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
    
    // Check for pending transactions, but allow if it's for the same plan (upgrade scenario)
    const pendingTransaction = await Transaction.findOne({
      user: userId,
      status: 'pending',
      type: 'subscription'
    });
    
    if (pendingTransaction) {
      // If pending transaction is for the same plan being requested, allow it to proceed
      if (pendingTransaction.itemReference.toString() === planId) {
        return res.status(200).json({
          success: true,
          message: 'You have a pending payment for this plan. You can proceed to complete the payment.',
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
            existingTransaction: {
              id: pendingTransaction._id,
              amount: pendingTransaction.amount,
              createdAt: pendingTransaction.createdAt
            },
            action: 'complete_pending_payment'
          }
        });
      }
      
      // If pending transaction is for a different plan, block it
      return res.status(400).json({
        success: false,
        message: 'You have a pending payment transaction for a different plan. Please complete or cancel it first.',
        data: {
          pendingTransactionId: pendingTransaction._id,
          amount: pendingTransaction.amount,
          createdAt: pendingTransaction.createdAt,
          suggestion: 'Complete the pending payment or contact support to cancel it'
        }
      });
    }
    
    // Check for existing active subscriptions
    const existingActiveSubscription = await UserSubscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('plan');
    
    // CASE 1: No active subscription - Allow any plan
    if (!existingActiveSubscription) {
      // Check for any previous subscription for the same plan
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
                maxProfiles: plan.maxProfiles,
                description: plan.description
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
                maxProfiles: plan.maxProfiles,
                description: plan.description
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
      
      // No previous subscription or different plan - new subscription
      return res.status(200).json({
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
    }
    
    // CASE 2: Has active subscription
    // Check if requesting same plan
    if (planId === existingActiveSubscription.plan._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription for this plan.',
        data: {
          currentSubscription: {
            planName: existingActiveSubscription.plan.name,
            startDate: existingActiveSubscription.startDate,
            endDate: existingActiveSubscription.endDate,
            status: existingActiveSubscription.status,
            daysRemaining: Math.ceil((existingActiveSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24))
          },
          suggestedAction: 'already_subscribed'
        }
      });
    }
    
    // CASE 3: Different plan - check if upgrade/downgrade
    const isUpgrade = plan.price > existingActiveSubscription.plan.price;
    const isDowngrade = plan.price < existingActiveSubscription.plan.price;
    
    // If your business logic only allows upgrades, uncomment this:
    /*
    if (isDowngrade) {
      return res.status(400).json({
        success: false,
        message: 'Plan downgrade is not allowed. Please select a higher-tier plan.',
        data: {
          currentPlan: {
            name: existingActiveSubscription.plan.name,
            price: existingActiveSubscription.plan.price
          },
          requestedPlan: {
            name: plan.name,
            price: plan.price
          }
        }
      });
    }
    */
    
    // Allow plan change (upgrade/downgrade)
    return res.status(200).json({
      success: true,
      message: `Plan ${isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : 'change'} detected. You can proceed with payment.`,
      data: {
        currentPlan: {
          id: existingActiveSubscription.plan._id,
          name: existingActiveSubscription.plan.name,
          price: existingActiveSubscription.plan.price,
          daysRemaining: Math.ceil((existingActiveSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24))
        },
        newPlan: {
          id: plan._id,
          name: plan.name,
          price: plan.price,
          duration: plan.duration,
          maxDevices: plan.maxDevices,
          maxProfiles: plan.maxProfiles,
          description: plan.description
        },
        changeType: isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : 'change',
        priceDifference: plan.price - existingActiveSubscription.plan.price,
        action: 'plan_change',
        user: {
          id: userId,
          name: req.user.name,
          email: req.user.email
        }
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
// router.post('/initiate-subscription', isUser, async (req, res) => {
//   try {
//     const { planId } = req.body;
//     const userId = req.user.id;
    
//     // Validate plan exists and is active
//     const plan = await SubscriptionPlan.findById(planId);
//     if (!plan || !plan.isActive) {
//       return res.status(404).json({
//         success: false,
//         message: 'Subscription plan not found or inactive'
//       });
//     }
    
//     // Check for pending transactions first (prevent double transactions)
//     const pendingTransaction = await Transaction.findOne({
//       user: userId,
//       status: 'pending',
//       type: 'subscription'
//     });
    
//     if (pendingTransaction) {
//       return res.status(400).json({
//         success: false,
//         message: 'You have a pending payment transaction. Please complete or cancel it first.',
//         data: {
//           pendingTransactionId: pendingTransaction._id,
//           amount: pendingTransaction.amount,
//           createdAt: pendingTransaction.createdAt
//         }
//       });
//     }
    
//     // Check for existing active subscriptions
//     const existingActiveSubscription = await UserSubscription.findOne({
//       user: userId,
//       status: 'active',
//       endDate: { $gt: new Date() }
//     }).populate('plan');
    
//     // CASE 1: No active subscription - Allow any plan
//     if (!existingActiveSubscription) {
//       // Check for any previous subscription for the same plan
//       const existingPlanSubscription = await UserSubscription.findOne({
//         user: userId,
//         plan: planId
//       }).populate('plan');
      
//       if (existingPlanSubscription) {
//         const subscriptionStatus = {
//           planName: existingPlanSubscription.plan.name,
//           startDate: existingPlanSubscription.startDate,
//           endDate: existingPlanSubscription.endDate,
//           status: existingPlanSubscription.status
//         };
        
//         if (existingPlanSubscription.status === 'expired') {
//           return res.status(200).json({
//             success: true,
//             message: 'Your previous subscription has expired. You can renew it.',
//             data: {
//               plan: {
//                 id: plan._id,
//                 name: plan.name,
//                 price: plan.price,
//                 duration: plan.duration,
//                 maxDevices: plan.maxDevices,
//                 maxProfiles: plan.maxProfiles,
//                 description: plan.description
//               },
//               user: {
//                 id: userId,
//                 name: req.user.name,
//                 email: req.user.email
//               },
//               previousSubscription: subscriptionStatus,
//               action: 'renewal'
//             }
//           });
//         } else if (existingPlanSubscription.status === 'canceled') {
//           return res.status(200).json({
//             success: true,
//             message: 'You can reactivate your canceled subscription.',
//             data: {
//               plan: {
//                 id: plan._id,
//                 name: plan.name,
//                 price: plan.price,
//                 duration: plan.duration,
//                 maxDevices: plan.maxDevices,
//                 maxProfiles: plan.maxProfiles,
//                 description: plan.description
//               },
//               user: {
//                 id: userId,
//                 name: req.user.name,
//                 email: req.user.email
//               },
//               previousSubscription: subscriptionStatus,
//               action: 'reactivation'
//             }
//           });
//         }
//       }
      
//       // No previous subscription or different plan - new subscription
//       return res.status(200).json({
//         success: true,
//         message: 'Subscription can be initiated. You are eligible for this plan.',
//         data: {
//           plan: {
//             id: plan._id,
//             name: plan.name,
//             price: plan.price,
//             duration: plan.duration,
//             maxDevices: plan.maxDevices,
//             maxProfiles: plan.maxProfiles,
//             description: plan.description
//           },
//           user: {
//             id: userId,
//             name: req.user.name,
//             email: req.user.email
//           },
//           eligibility: {
//             canSubscribe: true,
//             hasActiveSubscription: false,
//             hasPendingPayment: false
//           },
//           action: 'new_subscription'
//         }
//       });
//     }
    
//     // CASE 2: Has active subscription
//     // Check if requesting same plan
//     if (planId === existingActiveSubscription.plan._id.toString()) {
//       return res.status(400).json({
//         success: false,
//         message: 'You already have an active subscription for this plan.',
//         data: {
//           currentSubscription: {
//             planName: existingActiveSubscription.plan.name,
//             startDate: existingActiveSubscription.startDate,
//             endDate: existingActiveSubscription.endDate,
//             status: existingActiveSubscription.status,
//             daysRemaining: Math.ceil((existingActiveSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24))
//           },
//           suggestedAction: 'already_subscribed'
//         }
//       });
//     }
    
//     // CASE 3: Different plan - check if upgrade/downgrade
//     const isUpgrade = plan.price > existingActiveSubscription.plan.price;
//     const isDowngrade = plan.price < existingActiveSubscription.plan.price;
    
//     // If your business logic only allows upgrades, uncomment this:
//     /*
//     if (isDowngrade) {
//       return res.status(400).json({
//         success: false,
//         message: 'Plan downgrade is not allowed. Please select a higher-tier plan.',
//         data: {
//           currentPlan: {
//             name: existingActiveSubscription.plan.name,
//             price: existingActiveSubscription.plan.price
//           },
//           requestedPlan: {
//             name: plan.name,
//             price: plan.price
//           }
//         }
//       });
//     }
//     */
    
//     // Allow plan change (upgrade/downgrade)
//     return res.status(200).json({
//       success: true,
//       message: `Plan ${isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : 'change'} detected. You can proceed with payment.`,
//       data: {
//         currentPlan: {
//           id: existingActiveSubscription.plan._id,
//           name: existingActiveSubscription.plan.name,
//           price: existingActiveSubscription.plan.price,
//           daysRemaining: Math.ceil((existingActiveSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24))
//         },
//         newPlan: {
//           id: plan._id,
//           name: plan.name,
//           price: plan.price,
//           duration: plan.duration,
//           maxDevices: plan.maxDevices,
//           maxProfiles: plan.maxProfiles,
//           description: plan.description
//         },
//         changeType: isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : 'change',
//         priceDifference: plan.price - existingActiveSubscription.plan.price,
//         action: 'plan_change',
//         user: {
//           id: userId,
//           name: req.user.name,
//           email: req.user.email
//         }
//       }
//     });
    
//   } catch (error) {
//     console.error('Subscription initiation error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error checking subscription eligibility',
//       error: error.message
//     });
//   }
// });


// 3. KEEP YOUR EXISTING create-order AS IS (no changes needed!)
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
// 4. UPDATED: Enhanced verify-payment to handle upgrades
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
    console.log("before"+planId);
    const plan = await SubscriptionPlan.findById(planId);
    console.log("after"+planId);
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

    // Check for existing active subscription
    const existingActiveSubscription = await UserSubscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('plan');

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration);

    // Update transaction status first
    await Transaction.findByIdAndUpdate(transactionId, {
      status: 'completed',
      paymentId: razorpay_payment_id,
      completedAt: new Date()
    });

    if (existingActiveSubscription && planId !== existingActiveSubscription.plan._id.toString()) {
      // This is a plan change (upgrade/downgrade)
      const isUpgrade = plan.price > existingActiveSubscription.plan.price;
      const previousPlan = existingActiveSubscription.plan.name;
      
      // Update existing subscription with new plan
      const updatedSubscription = await UserSubscription.findByIdAndUpdate(
        existingActiveSubscription._id,
        {
          plan: planId,
          endDate: endDate,
          paymentId: razorpay_payment_id,
          transactionId: transactionId,
          // Keep original startDate to maintain subscription history
        },
        { new: true }
      ).populate('plan');

      return res.json({ 
        success: true, 
        message: `Plan ${isUpgrade ? 'upgraded' : 'downgraded'} successfully! Your subscription has been updated.`,
        data: {
          subscription: {
            id: updatedSubscription._id,
            planName: plan.name,
            previousPlan: previousPlan,
            startDate: updatedSubscription.startDate,
            endDate: updatedSubscription.endDate,
            status: updatedSubscription.status,
            daysRemaining: Math.ceil((updatedSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24)),
            changeType: isUpgrade ? 'upgrade' : 'downgrade',
            priceDifference: plan.price - existingActiveSubscription.plan.price
          },
          transaction: {
            id: transactionId,
            paymentId: razorpay_payment_id,
            amount: plan.price,
            type: 'plan_change'
          }
        }
      });
      
    } else if (existingActiveSubscription && planId === existingActiveSubscription.plan._id.toString()) {
      // Same plan - this shouldn't happen but handle gracefully
      await Transaction.findByIdAndUpdate(transactionId, {
        status: 'failed',
        failureReason: 'User already has active subscription for this plan'
      });
      return res.status(400).json({
        success: false,
        message: 'Cannot complete payment: You already have an active subscription for this plan'
      });
    }

    // No active subscription - create new one
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

    console.log("New subscription created successfully:", newSubscription);

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
          amount: plan.price,
          type: 'new_subscription'
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
// 5. KEEP YOUR EXISTING my-subscription AS IS (no changes needed!)
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
// 6. KEEP YOUR EXISTING cancel-subscription AS IS (no changes needed!)
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
// Logout route
// Logout API
router.post('/users-logout', isUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Optional: Remove device session (if tracked)
    await User.findByIdAndUpdate(userId, {
      $pull: {
        deviceSessions: {
          ip: req.ip
        }
      }
    });

    return res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/user/transactions', isUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all user subscriptions with related plan and transaction details
    const subscriptions = await UserSubscription.find({ user: userId })
      .populate('plan') // Includes subscription plan details
      .populate('transactionId') // Includes transaction details
      .sort({ createdAt: -1 }); // Newest first

    return res.status(200).json({ subscriptions });
  } catch (err) {
    console.error('Error fetching subscription transactions:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
