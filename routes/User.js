
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
const Category = require("../models/Category")
const JWT_SECRET = process.env.JWT_SECRET || "Apple";
// const { protect,verifyToken } = require('../middleware/auth');
const { protect } = require("../middleware/auth");
const { body, validationResult } = require('express-validator');
const multer = require("multer");
const storage = multer.memoryStorage();
const PDFDocument = require("pdfkit");
const upload = multer({ storage: storage });
dotenv.config();
const router = express.Router();
const fs = require("fs");
const path = require("path");
const Movie = require("../models/Movie");
const Content = require("../models/Content");
const downloadsDir = path.join(__dirname, "../downloads");
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
// sign up for the users
router.post('/signup', async (req, res) => {
  // console.log(req.body)
  try {
    const { email } = req.body;

    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ email });
    await newUser.save();

    res.status(201).json({ message: 'User signed up successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// ✅ Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending OTP', error: err.message });
  }
});
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'user not found' });
    }

    // if (user.otp !== otp || user.otpExpiry < new Date()) {
    //   return res.status(400).json({ message: 'Invalid or expired OTP' });
    // }

    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});  
// ✅ Step 1: Login - Send OTP
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
// ✅ Step 2: Verify OTP and Login
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'user not found' });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP after verification
    user.otp = null;
    user.otpExpiry = null;
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
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
}
});
router.get('/approved-movies', async (req, res) => {
    try {
      const movies = await Content.find({ status: 'approved' });
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

    const movies = await Content.find({
      title: { $regex: title, $options: 'i' } // only title filter, no status check
    });

    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

  module.exports = router; 
