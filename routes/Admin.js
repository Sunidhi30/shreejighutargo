const express = require('express');
const nodemailer = require("nodemailer");
const { uploadToCloudinary } = require("../utils/cloudinary");
const jwt = require('jsonwebtoken');
const Producer = require("../models/Producer");
const { ContestController} = require('../controllers/contestController');
const Contest = require("../models/Contest")
const ContestRules = require("../models/ContestRules")
const dotenv = require('dotenv');
const RentalLimit = require("../models/RentalLimit");
const HomeSection = require('../models/HomeSection');
const Series =require("../models/Series")
const User = require('../models/User');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const VendorsWithdrawalRequest = require("../models/VendorWithdrawalRequest")
const ExcelJS = require('exceljs');
const Package = require("../models/Package");
const  Setting = require("../models/LikesSetting");
const PackageDetail = require('../models/PackageDetail');
const Category = require("../models/Category")
const JWT_SECRET = process.env.JWT_SECRET || "Apple";
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Plans = require("../models/Subscription")
const crypto = require('crypto');
const sendEmail= require("../utils/sendEmail");
const  Video = require("../models/Video");
const Channel = require("../models/Channel");
const Banner = require("../models/Banner");
const TVShow = require("../models/TVShow");
const Season = require("../models/Season");
const VendorLockPeriod= require("../models/LockPeriod")
const Comment = require("../models/Commet");
const Transaction  = require("../models/Transactions");
const Subscription = require('../models/Subscription'); // adjust the path if needed
const { protect , verifyAdmin, isVendor , isUser} = require("../middleware/auth");
const { body, validationResult } = require('express-validator');
const multer = require("multer");
const storage = multer.memoryStorage();
const PDFDocument = require("pdfkit");
const upload = multer({ storage: storage });
const cloudinary = require("cloudinary").v2;
const Language = require('../models/Language');
dotenv.config();
const router = express.Router();
const fs = require("fs");
const Admin = require("../models/Admin");
const path = require("path");
const downloadsDir = path.join(__dirname, "../downloads");
const Type = require("../models/Type");
const bcrypt = require('bcryptjs');
const TVSeason = require("../models/Tvshowsseason")
const Vendor = require('../models/Vendor');
const Cast = require('../models/Cast'); 
const sendMail = require('../utils/sendEmail');
const generateRandomUsername = () => `vendor_${crypto.randomBytes(4).toString('hex')}`;
const generateRandomPassword = () => crypto.randomBytes(6).toString('hex');
const Content = require("../models/Content");
const UpcomingContent = require("../models/UpcomingContent");
require('dotenv').config(); // Needed to load .env variables
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true }); // Creates folder if missing
}
// // Admin Login (Dynamically Generated OTP)
const transporter = nodemailer.createTransport({ 
    service: 'gmail', // Use your email provider
    auth: {
      user: process.env.EMAIL_USER, // Admin email (set in environment variables)
      pass: process.env.EMAIL_PASS // Admin email password (use env variables for security)
    }
  });
 
  // ✅ Send OTP Email function
const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
      from: `"Everything Like in the Movies" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Admin Login',
      text: `Your One-Time Password (OTP) is: ${otp}\nThis OTP is valid for 10 minutes.`,
    };
    await transporter.sendMail(mailOptions);
};
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Authorization token missing or malformed' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // console.log('Decoded JWT:', decoded); // <-- Inspect structure here

    // 👇 Adjust this based on actual decoded token
    req.user = {
      id: decoded._id || decoded.id, // fallback if needed
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
const validateContestParticipation = async (vendor, video, contest) => {
  const contestRules = await ContestRules.findOne({ contest_id: contest._id });
  const errors = [];

  // Check account age
  const accountAge = Math.floor((Date.now() - vendor.createdAt) / (1000 * 60 * 60 * 24));
  if (accountAge < contestRules.eligibilityCriteria.minAccountAge) {
    errors.push('Vendor account does not meet minimum age requirement');
  }

  // Check video count
  const vendorVideoCount = await Video.countDocuments({ vendor_id: vendor._id });
  if (vendorVideoCount < contestRules.eligibilityCriteria.minVideoCount) {
    errors.push('Vendor does not have minimum required videos');
  }

  // Check video duration
  if (video.video_duration < contestRules.eligibilityCriteria.minVideoDuration ||
      video.video_duration > contestRules.eligibilityCriteria.maxVideoDuration) {
    errors.push('Video duration does not meet requirements');
  }

  // Check video quality
  const hasRequiredQuality = contestRules.eligibilityCriteria.requiredVideoQuality.some(
    quality => video[`video_${quality.replace('p', '')}`]
  );
  if (!hasRequiredQuality) {
    errors.push('Video quality does not meet requirements');
  }

  // Check submission count
  const existingSubmissions = contest.participants.filter(
    p => p.vendor_id.toString() === vendor._id.toString()
  ).length;
  if (existingSubmissions >= contestRules.submissionGuidelines.maxSubmissionsPerVendor) {
    errors.push('Maximum submission limit reached');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// GET /admin/profile
router.get('/admin/profile', async (req, res) => {
  try {
    // Assuming there's only one admin
    const admin = await Admin.findOne();

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({
      email: admin.email,
      otp: admin.otp,
      otpExpiry: admin.otpExpiry,
      role: admin.role,
      targetAmount: admin.targetAmount,
      wallet: admin.wallet,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// ✅ Sign Up Admin (only email)
// both were working fine
// router.post('/signup', async (req, res) => {
//   try {
//     const { email } = req.body;

//     let existingAdmin = await Admin.findOne({ email });
//     if (existingAdmin) {
//       return res.status(400).json({ message: 'Admin already exists' });
//     }

//     // Generate OTP and its expiry
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

//     // Create new Admin with OTP
//     const newAdmin = new Admin({
//       email,
//       otp,
//       otpExpiry
//     });
  
//     await newAdmin.save();

//     // Send OTP via email
//     await sendOTPEmail(email, otp);

//     res.status(201).json({ message: 'Admin signed up successfully, OTP sent to email' });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// });
// // verify sign up otp 
//   router.post('/verify-otp', async (req, res) => {
//     try {
//       const { email, otp } = req.body;
  
//       const admin = await Admin.findOne({ email });
//       if (!admin) {
//         return res.status(404).json({ message: 'Admin not found' });
//       }
  
//       if (admin.otp !== otp || admin.otpExpiry < new Date()) {
//         return res.status(400).json({ message: 'Invalid or expired OTP' });
//       }
  
//       admin.otp = null;
//       admin.otpExpiry = null;
//       await admin.save();
  
//       const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
//         expiresIn: '7d',
//       });
  
//       res.status(200).json({
//         message: 'Login successful',
//         token,
//         admin: {
//           id: admin._id,
//           email: admin.email,
//         },
//       });
//     } catch (err) {
//       res.status(500).json({ message: 'Server error', error: err.message });
//     }
//   });  
router.post('/signup', async (req, res) => {
  try {
    const { email } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Generate OTP and expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins

    // Store in session
    req.session.signupData = {
      email,
      otp,
      otpExpiry,
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
    console.log(signupData)
    if (!signupData) {
      return res.status(400).json({ message: 'Session expired or no OTP request found' });
    }

    if (signupData.otp !== otp || Date.now() > signupData.otpExpiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Create the admin
    const newAdmin = new Admin({ email: signupData.email });
    await newAdmin.save();

    // Clear the session
    req.session.signupData = null;

    // Generate token
    const token = jwt.sign({ id: newAdmin._id, role: newAdmin.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'Signup successful',
      token,
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
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
  
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 mins
  
      admin.otp = otp;
      admin.otpExpiry = otpExpiry;
      await admin.save();
  
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
  
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      if (admin.otp !== otp || admin.otpExpiry < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
      // Clear OTP after verification
      admin.otp = null;
      admin.otpExpiry = null;
      await admin.save();
      const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, {
        expiresIn: '7d',
      });
      res.status(200).json({
        message: 'Login successful',
        token,
        admin: {
          id: admin._id,
          email: admin.email,
        },
      });
    } catch (err) {
      res.status(500).json({ message: 'OTP verification failed', error: err.message });
 }
});
// Admin sets per-view price
router.put('/set-price-per-view', verifyAdmin, async (req, res) => {
  try {
    const { pricePerView } = req.body;

    if (typeof pricePerView !== 'number' || pricePerView < 0) {
      return res.status(400).json({ success: false, message: 'Invalid price per view value' });
    }

    const adminId = req.admin.id; // from isAdmin middleware
    await Admin.findByIdAndUpdate(adminId, { pricePerView });

    res.json({ success: true, message: 'Per-view price updated successfully', pricePerView });
  } catch (error) {
    console.error('Error updating price per view:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// add type 
router.post('/add_type', verifyAdmin, async (req, res) => {
  try {
    console.log(req.body)
    let { name, type, status = 1 } = req.body;
    console.log(req.body)
    if (!name || typeof type !== 'number') {
      return res.status(400).json({ message: 'Missing required fields: name or type' });
    }
    // Normalize name to lowercase
    name = name.toLowerCase();

    // Check if type with same name already exists (case-insensitive)
    const existingType = await Type.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existingType) {
      return res.status(400).json({ message: 'Type already exists with this name' });
    }

    const newType = new Type({ name, type, status });
    await newType.save();

    return res.status(201).json({
      message: 'Type added successfully',
      data: newType
    });
  } catch (error) {
    console.error('Error adding type:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// get types 
router.get('/get_types', async (req, res) => {
  try {
    const types = await Type.find().sort({ name: 1 }); // sort by name if needed
  console.log("types "+types)
    return res.status(200).json({
      message: 'Types fetched successfully',
      data: types
    });
  } catch (error) {
    console.error('Error fetching types:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
// add language 
router.post('/add_category',verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, status } = req.body;
    console.log(req.body);

    let CategoryImage = '';
    if (req.file) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      CategoryImage = await uploadToCloudinary(base64, "plansImage", req.file.mimetype);
      console.log(CategoryImage);
    } else {
      return res.status(400).json({ message: 'Image upload failed' });
    }

    const newCategory = new Category({
      name,
      image: CategoryImage,
      status: status || 1,
    });

    await newCategory.save();
    res.status(201).json({ message: 'Category added successfully', category: newCategory });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// get categroy 
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
// POST /api/languages/add_language
router.post('/add_language',verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, status } = req.body;
    console.log(req.body);

    let LanguageImage = '';
    if (req.file) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      LanguageImage = await uploadToCloudinary(base64, "plansImage", req.file.mimetype);
      console.log(LanguageImage);
    } else {
      return res.status(400).json({ message: 'Image upload failed' });
    }
    const newLanguage = new Language({
      name,
      image: LanguageImage,
      status: status || 1,
    });

    await newLanguage.save();
    res.status(201).json({ message: 'Language added successfully', language: newLanguage });
  } catch (error) {
    console.error('Error adding language:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// get languagues
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
// router.get('/get_cast', async (req, res) => {
//   try {
//     const languages = await Cast.find().sort({ name: 1 }); // Optional sorting by name

//     return res.status(200).json({
//       message: 'Cast fetched successfully',
//       data: languages
//     });
//   } catch (error) {
//     console.error('Error fetching Cast:', error);
//     return res.status(500).json({ message: 'Internal Server Error' });
//   }
// });
// Update a category
router.put(
    "/:id",
    upload.single("icon"),
    [
        body("name").optional().trim(),
        body("description").optional().trim(),
        body("displayOrder").isNumeric().optional()
    ],
    async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, isActive, displayOrder, parentCategory } = req.body;
            let iconUrl = req.body.icon; // Keep existing icon if not updating

            if (req.file) {
                iconUrl = await uploadToCloudinary(req.file.path, "categories");
            }

            const updatedCategory = await Category.findByIdAndUpdate(
                id,
                { name, description, icon: iconUrl, isActive, displayOrder, parentCategory },
                { new: true }
            );

            if (!updatedCategory) {
                return res.status(404).json({ status: 404, errors: "Category not found" });
            }

            res.status(200).json({ status: 200, success: "Category updated successfully", category: updatedCategory });
        } catch (error) {
            res.status(500).json({ status: 500, errors: error.message });
        }
    }
);
// Delete a category
router.delete("/:id",verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ status: 404, errors: "Category not found" });
        }

        await Category.findByIdAndDelete(id);
        res.status(200).json({ status: 200, success: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: 500, errors: error.message });
    }
});
// Add vendor 
router.post('/add-vendor', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
      const { fullName, email} = req.body;
      const file = req.file;
  
      if (!fullName || !email || !file) {
        return res.status(400).json({ message: 'All fields including image are required' });
      }
  
      const existing = await Vendor.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already exists' });
      }
  
      const username = generateRandomUsername();
      const plainPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
      // Convert image to base64
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      const cloudinaryResult = await uploadToCloudinary(base64, "image", file.mimetype);
  
      const newVendor = new Vendor({
        image: cloudinaryResult.secure_url,
        username,
        fullName: fullName.trim(),
        email: email.trim(),
        password: hashedPassword,
        status: 'pending'
      });
  
      await newVendor.save();
  
      // Send Email with credentials
      const emailText = `
  Hi ${fullName},
  
  Your vendor account has been created.
  
  Here are your login credentials:
  Username: ${username}
  Password: ${plainPassword}
  
  Please log in to your vendor dashboard and change your password after first login.
  
  Thanks,
  Team Admin
  `;
  
      await sendEmail(email, 'Your Vendor Account Credentials', emailText);
  
      res.status(201).json({
        message: 'Vendor added successfully and credentials emailed',
        vendor: {
          _id: newVendor._id,
          username,
          email
        }
      });
  
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
// get vendor 
router.get('/get-vendors', async (req, res) => {
  try {
    const vendors = await Vendor.find().select('-password'); // Exclude password
    res.status(200).json({ vendors });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
  // add cast 
router.post('/add-cast', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
      const { name, type } = req.body;
      const file = req.file;
  
      if (!name || !type) {
        return res.status(400).json({ message: "Name and type are required" });
      }
  
      if (!file) {
        return res.status(400).json({ message: "Image file is required" });
      }
  
      const imageUrl = await uploadToCloudinary(file.buffer, "image", file.mimetype);
  
      if (!imageUrl) {
        return res.status(500).json({ message: "Cloudinary upload failed", error: "No URL returned" });
      }
  
      const newCast = new Cast({
        name,
        type,
        image: imageUrl
      });
  
      const savedCast = await newCast.save();
      res.status(201).json({ message: "Cast member added successfully", cast: savedCast });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  });
  
  // get cast 
router.get('/get-casts', async (req, res) => {
    try {
      const casts = await Cast.find();
      res.status(200).json({ casts });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

// get admin users
router.get('/admin/users', verifyAdmin,async (req, res) => {
  try {
    const users = await User.find({ deleted: false }).select(
      'profileImage fullName username email mobile createdAt'
    );
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});
// get movies
router.get('/admin/movies', verifyAdmin,async (req, res) => {
  try {
    const movies = await Video.find({ status: 'approved' }).select('title');

    res.status(200).json({ movies });
  } catch (err) {
    console.error('Error fetching movies:', err);
    res.status(500).json({ message: 'Server error while fetching movies' });
  }
});
// top 10 movies 
// Mark a movie as Top 10
router.put('/admin/top10-movies/add', verifyAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Movie name is required' });
  }
  try {
    // Check how many movies are already marked as Top 10
    const currentTop10 = await Video.countDocuments({ isTop10: true });
    if (currentTop10 >= 10) {
      return res.status(400).json({ message: 'Top 10 list already full. Remove one before adding.' });
    }

    // Find the movie by name and status 'approved' and mark it as Top 10
    const movie = await Video.findOneAndUpdate(
      { name, isApproved:true },
      { $set: { isTop10: true } }, // ✅ Setting isTop10 true
      { new: true }
    );

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found or not approved' });
    }

    res.status(200).json({
      message: `"${movie.name}" has been added to the Top 10 list.`,
      movie
    });
  } catch (err) {
    console.error('Error marking movie as Top 10:', err);
    res.status(500).json({ message: 'Server error while updating Top 10 movie' });
  }
});

// GET /content/webseries
router.get('/content/webseries', async (req, res) => {
  const { name } = req.query;

  try {
    const webSeriesType = await Type.findOne({ name: new RegExp(name, 'i') }); // Case-insensitive search

    if (!webSeriesType) {
      return res.status(404).json({ message: 'Web Series type not found.' });
    }

    const webSeries = await Content.find({ type: webSeriesType._id, status: 'approved' })
      .populate('category')
      .populate('language')
      .populate('cast');

    res.status(200).json({ webSeries });
  } catch (error) {
    console.error('Error fetching web series:', error);
    res.status(500).json({ message: 'Server error fetching web series.' });
  }
});
// get the list by type name 
router.get('/types', async (req, res) => {
  try {
    const types = await Type.find({ isVisible: true }).select('type name');
    res.status(200).json({ types });
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({ message: 'Server error fetching types.' });
  }
});
// get types of list 
router.get('/types/:type', async (req, res) => {
  const { type } = req.params;

  try {
    const types = await Type.find({ type: type, isVisible: true }).select('type name');
    res.status(200).json({ types });
  } catch (error) {
    console.error('Error fetching types by type:', error);
    res.status(500).json({ message: 'Server error fetching types.' });
  }
});
// upcoming banners 
router.post('/upcoming-banners',verifyAdmin, upload.single('banner'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      type,
      duration,
      language,
      releaseDate,
      cast,
      uploadedBy
    } = req.body;
    console.log("requested upcoming"+" "+req.body)
    const categoryNames = category ? category.split(',').map(name => name.trim()) : [];
    const categoryDocs = await Category.find({ name: { $in: categoryNames } });

    if (categoryDocs.length !== categoryNames.length) {
      const foundNames = categoryDocs.map(c => c.name);
      const notFound = categoryNames.filter(name => !foundNames.includes(name));
      return res.status(400).json({ message: `Category not found: ${notFound.join(', ')}` });
    }
    const categoryIds = categoryDocs.map(cat => cat._id);
    const typeDoc = await Type.findOne({ name: type.trim() });
    if (!typeDoc) {
      return res.status(400).json({ message: `Type not found: ${type}` });
    }
  
    const languageDoc = await Language.findOne({ name: language.trim() });
    if (!languageDoc) {
      return res.status(400).json({ message: `Language not found: ${language}` });
    }
    const newUpcoming = new UpcomingContent({
      title,
      description,
      category: categoryIds,
      type,
      duration,
      language: languageDoc._id,
      releaseDate,
      cast: cast ? cast.split(',') : [],
      bannerUrl: req.file ? `/uploads/banners/${req.file.filename}` : null,
      uploadedBy
    });
    const saved = await newUpcoming.save();
    res.status(201).json({
      message: 'Upcoming content uploaded successfully',
      data: saved
    });
  } catch (err) {
    console.error('Error uploading upcoming content:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// add channel( like startplus)
router.post('/add-channel', verifyAdmin,upload.fields([
  { name: 'portrait_img', maxCount: 1 },
  { name: 'landscape_img', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, is_title, status } = req.body;

    const portraitFile = req.files['portrait_img']?.[0];
    const landscapeFile = req.files['landscape_img']?.[0];

    if (!name || !portraitFile || !landscapeFile) {
      return res.status(400).json({ message: 'Missing required fields or images' });
    }

    // Convert portrait image to base64
    const portraitBase64 = `data:${portraitFile.mimetype};base64,${portraitFile.buffer.toString('base64')}`;
    const portraitUrl = await uploadToCloudinary(portraitBase64, 'channelImages', portraitFile.mimetype);

    // Convert landscape image to base64
    const landscapeBase64 = `data:${landscapeFile.mimetype};base64,${landscapeFile.buffer.toString('base64')}`;
    const landscapeUrl = await uploadToCloudinary(landscapeBase64, 'channelImages', landscapeFile.mimetype);

    // Save to DB
    const newChannel = new Channel({
      name,
      portrait_img: portraitUrl,
      landscape_img: landscapeUrl,
      is_title: is_title || 0,
      status: status || 1
    });

    await newChannel.save();

    res.status(201).json({ message: 'Channel added successfully', channel: newChannel });
  } catch (err) {
    console.error('Error while adding channel:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Get all channels
router.get('/get-channels', async (req, res) => {
  try {
    const channels = await Channel.find();
    res.status(200).json({ channels });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// add producer 
router.post('/add-producer',verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    const { user_name, full_name, email, password, mobile_number, status } = req.body;

    if (!user_name || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Optional image upload
    let imageUrl = '';
    if (req.file && req.file.buffer) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      imageUrl = await uploadToCloudinary(base64, 'producerImages', req.file.mimetype);
    }

    const newProducer = new Producer({
      user_name,
      full_name,
      email,
      password: hashedPassword,
      mobile_number,
      image: imageUrl,
      status: status || 1
    });

    await newProducer.save();

    res.status(201).json({ message: 'Producer added successfully', producer: newProducer });
  } catch (error) {
    console.error('Error adding producer:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
router.get('/get-producers', async (req, res) => {
  try {
    // Fetch all producers with their names and ids
    const producers = await Producer.find({}, 'user_name _id'); // Fields to select (user_name and _id)

    if (!producers || producers.length === 0) {
      return res.status(404).json({ message: 'No producers found' });
    }

    res.status(200).json({ producers });
  } catch (error) {
    console.error('Error fetching producers:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// approves the video for the vendor 
router.post('/approve/:videoId', verifyAdmin,async (req, res) => {
  try {
    const { videoId } = req.params;
    const updatedVideo = await Video.findByIdAndUpdate(videoId, { isApproved: true }, { new: true });

    if (!updatedVideo) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    res.status(200).json({ success: true, message: 'Video approved', video: updatedVideo });
  } catch (error) {
    console.error('Approval Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});
// POST /api/banners - Add new banner
router.post('/banners',verifyAdmin, async (req, res) => {
  try {
    const {
      is_home_screen = 0,
      type_id,
      video_type,
      video_id,
      status = 1
    } = req.body;
    if (!type_id || !video_id) {
      return res.status(400).json({ message: 'Type and Video are required' });
    }
    const newBanner = new Banner({
      is_home_screen,
      type_id,
      video_type,
      video_id,
      status
    });
    const savedBanner = await newBanner.save();
    res.status(201).json({ message: 'Banner created successfully', banner: savedBanner });
  } catch (err) {
    console.error('Add Banner Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// add the tv shows 
// Create TV Show
// router.post(
//   '/create',
//   upload.fields([
//     { name: 'thumbnail', maxCount: 1 },
//     { name: 'landscape', maxCount: 1 },
//     { name: 'trailer', maxCount: 1 }
//   ]),
//   async (req, res) => {
//     try {
//       const {
//         type_id, video_type, channel_id, producer_id, category_id,
//         language_id, cast_id, name, trailer_type, description,
//         release_date, is_title, is_like, is_comment,
//         total_like, total_view, is_rent, price, rent_day, status
//       } = req.body;

//       const thumbnail = req.files['thumbnail']?.[0]?.path || '';
//       const landscape = req.files['landscape']?.[0]?.path || '';
//       const trailer_url = req.files['trailer']?.[0]?.path || '';

//       const tvShow = new TVShow({
//         type_id, video_type, channel_id, producer_id, category_id,
//         language_id, cast_id, name, trailer_type, trailer_url,
//         description, release_date, is_title, is_like, is_comment,
//         total_like, total_view, is_rent, price, rent_day, status,
//         thumbnail, landscape
//       });

//       await tvShow.save();
//       res.status(201).json({ success: true, data: tvShow });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ success: false, message: 'TV Show creation failed' });
//     }
//   }
// );
router.post(
  '/create-tvShow',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'landscape', maxCount: 1 },
    { name: 'trailer', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        type_id, video_type, channel_id, producer_id, category_id,
        language_id, cast_id, name, trailer_type, description,
        release_date, is_title, is_like, is_comment,
        total_like, total_view, is_rent, price, rent_day, status
      } = req.body;

      let thumbnailUrl = '', landscapeUrl = '', trailerUrl = '';

      // Upload files to Cloudinary if provided
      if (req.files['thumbnail']) {
        const file = req.files['thumbnail'][0];
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        thumbnailUrl = await uploadToCloudinary(base64, 'tvshows/thumbnails', file.mimetype);
      }

      if (req.files['landscape']) {
        const file = req.files['landscape'][0];
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        landscapeUrl = await uploadToCloudinary(base64, 'tvshows/landscapes', file.mimetype);
      }

      if (req.files['trailer']) {
        const file = req.files['trailer'][0];
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        trailerUrl = await uploadToCloudinary(base64, 'tvshows/trailers', file.mimetype);
      }

      const tvShow = new TVShow({
        type_id, video_type, channel_id, producer_id, category_id,
        language_id, cast_id, name, trailer_type,
        trailer_url: trailerUrl,
        description, release_date, is_title, is_like, is_comment,
        total_like, total_view, is_rent, price, rent_day, status,
        thumbnail: thumbnailUrl,
        landscape: landscapeUrl
      });

      await tvShow.save();
      res.status(201).json({ success: true, data: tvShow });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'TV Show creation failed' });
    }
  }
);
// GET /api/users/count
router.get('/users-count', async (req, res) => {
  try {
    const count = await User.countDocuments({ deleted: false });
    res.status(200).json({ totalUsers: count });
  } catch (error) {
    console.error('Error counting users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// GET /api/videos/count
router.get('/videos-count', async (req, res) => {
  try {
    const count = await Video.countDocuments();
    res.status(200).json({ totalVideos: count });
  } catch (error) {
    console.error('Error counting videos:', error);
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
// get all users
router.get('/all-users', async (req, res) => {
  try {
    const users = await User.find({ deleted: false })
      .select('email image createdAt subscriptions')
      .populate({
        path: 'subscriptions',
        select: 'packageName price duration isActive startedAt expiresAt',
        options: { sort: { startedAt: -1 }, limit: 1 } // latest subscription
      });

    const formattedUsers = users.map(user => ({
      email: user.email,
      profileImage: user.image || '',
      registeredAt: user.createdAt,
      plan: user.subscriptions.length > 0 ? user.subscriptions[0] : null
    }));

    res.status(200).json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});
// get in excel format 
router.get('/export-users', async (req, res) => {
  try {
    const users = await User.find({ deleted: false })
      .select('email image createdAt subscriptions')
      .populate({
        path: 'subscriptions',
        select: 'packageName price duration isActive startedAt expiresAt',
        options: { sort: { startedAt: -1 }, limit: 1 }
      });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    worksheet.columns = [
      { header: 'S.No.', key: 'index', width: 10 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Profile-Image', key: 'profileImage', width: 40 },
      { header: 'Registration-Date', key: 'registeredAt', width: 25 },
      { header: 'Duration (Days)', key: 'duration', width: 15 },
      { header: 'Plan', key: 'plan', width: 20 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Active', key: 'isActive', width: 10 },
    ];
    

    users.forEach((user, index) => {
      const sub = user.subscriptions?.[0];
      worksheet.addRow({
        index: index + 1,
        email: user.email,
        profileImage: user.image || '',
        registeredAt: user.createdAt.toISOString().split('T')[0],
        plan: sub?.packageName || '',
        price: sub?.price || '',
        duration: sub?.duration || '',
        isActive: sub?.isActive ? 'Yes' : 'No'
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=users-list.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ success: false, message: 'Failed to export users' });
  }
});
// GET /api/comments - Get all comments with user email
router.get('/comments', async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate({
        path: 'user_id',
        select: 'email name' // Get email (and optionally name) from user
      });

    const result = comments.map(comment => ({
      comment: comment.comment,
      email: comment.user_id?.email || 'No Email',
      userName: comment.user_id?.name || 'Anonymous',
      createdAt: comment.createdAt,
      videoId: comment.video_id,
      episodeId: comment.episode_id
    }));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch comments', error: err.message });
  }
});
// Admin - Get List of All Transactions
router.get('/admin/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user_id', 'email')      // Get user details
      .populate('package_id', 'name price')  // Get package details
      .sort({ createdAt: -1 }); // Sorting by most recent

    res.status(200).json({ transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Admin - Get Wallet Balance
router.get('/wallet-balance', async (req, res) => {
  try {
    const admin = await Admin.findOne();

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({ wallet_balance: admin.wallet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// ✅ Set or Update Target
router.post('/set-target',verifyAdmin, async (req, res) => {
  const { adminId, targetAmount } = req.body;
  try {
    const admin = await Admin.findByIdAndUpdate(adminId, {
      targetAmount,
    }, { new: true });

    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.status(200).json({
      message: 'Target updated successfully',
      targetAmount: admin.targetAmount
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});
// ✅ Get Target Status
router.get('/target-status/:adminId', async (req, res) => {
  const { adminId } = req.params;

  try {
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const users = await User.find({});
    const totalInvested = users.reduce((sum, user) => sum + user.investedAmount, 0);
    const remaining = Math.max(admin.targetAmount - totalInvested, 0);

    res.status(200).json({
      targetAmount: admin.targetAmount,
      totalInvested,
      remaining,
      percentageCompleted: ((totalInvested / admin.targetAmount) * 100).toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});
// get user count according to month 
router.get('/users-monthly-count', async (req, res) => {
  try {
    const monthlyCounts = await User.aggregate([
      { $match: { deleted: false } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          month: "$_id",
          count: 1,
          _id: 0
        }
      },
      { $sort: { month: 1 } }
    ]);

    // Initialize an array with 12 zeros for each month
    const monthlyData = Array(12).fill(0);
    monthlyCounts.forEach(item => {
      monthlyData[item.month - 1] = item.count;
    });

    res.status(200).json({ monthlyData });
  } catch (error) {
    console.error('Error counting users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// GET: Count of users per subscription plan
router.get('/plans-summary', async (req, res) => {
  try {
    const users = await User.find({ deleted: false })
      .populate({
        path: 'subscriptions',
        populate: {
          path: 'package_id',
          model: 'Package'
        }
      });

    const planCounts = {};

    users.forEach(user => {
      user.subscriptions.forEach(sub => {
        const planName = sub.package_id?.name || 'Unknown';
        if (planCounts[planName]) {
          planCounts[planName]++;
        } else {
          planCounts[planName] = 1;
        }
      });
    });

    res.json({ success: true, plans: planCounts });
  } catch (err) {
    console.error('Error fetching plan summary:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// POST /admin/upload-profile-image
// Upload profile image
router.post('/admin/upload-profile-image',verifyAdmin, upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT
    const file = req.file;
  
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const uploadedImageUrl = await uploadToCloudinary(base64, 'admin_profiles', file.mimetype);

    const updatedAdmin = await Admin.findByIdAndUpdate(
      userId,
      { profileImage: uploadedImageUrl },
      { new: true }
    );

    if (!updatedAdmin) return res.status(404).json({ message: 'Admin not found' });

    res.status(200).json({
      message: 'Admin profile image uploaded successfully',
      profileImage: updatedAdmin.profileImage,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// Get admin profile
router.get('/profile', verifyAdmin, async (req, res) => {
  try {
    const userId = req.user.id;

    const admin = await Admin.findById(userId).select('-otp -otpExpiry');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.status(200).json(admin);
  } catch (err) {
    console.error('Error fetching admin profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Define your routes below not working 
router.patch('/update-profile', verifyAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const { profileImage } = req.body; // Fields that can be updated

    const updateData = {};

    // if (email) updateData.email = email;
    if (profileImage) updateData.profileImage = profileImage;

    const updatedAdmin = await Admin.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
      select: '-otp -otpExpiry -password'
    });

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      data: {
        // email: updatedAdmin.email,
        profileImage: updatedAdmin.profileImage || '',
        role: updatedAdmin.role,
      }
    });
  } catch (err) {
    console.error('Error updating admin profile:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});
// // Create package (admin only)
// Create a new subscription plan
router.post('/subscription-plans',verifyAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      duration,
      maxDevices,
      maxProfiles,
    } = req.body;

    const newPlan = new SubscriptionPlan({
      name,
      description,
      price,
      duration,
      maxDevices,
      maxProfiles,
      createdBy: req.admin._id
    });

    await newPlan.save();
    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: newPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating subscription plan',
      error: error.message
    });
  }
});
// Get all subscription plans (admin view)
router.get('/subscription-plans', verifyAdmin, async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ price: 1 });
    res.status(200).json({
      success: true,
      count: plans.length,
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
// Get a single subscription plan
router.get('/subscription-plans/:id', verifyAdmin, async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
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
// Update a subscription plan
router.put('/subscription-plans/:id', verifyAdmin, async (req, res) => {
  try {
    const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedPlan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: updatedPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating subscription plan',
      error: error.message
    });
  }
});
// Activate/Deactivate a subscription plan
router.patch('/subscription-plans/:id/toggle-status', verifyAdmin, async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }
    
    plan.isActive = !plan.isActive;
    await plan.save();
    
    res.status(200).json({
      success: true,
      message: `Subscription plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating subscription plan status',
      error: error.message
    });
  }
});
// set the maximum rental limit 
router.post('/set-rental-limit', verifyAdmin, async (req, res) => {
  const { maxRentalPrice } = req.body;
  if (!maxRentalPrice) {
    return res.status(400).json({ success: false, message: "maxRentalPrice is required" });
  }

  const limit = new RentalLimit({ maxRentalPrice });
  await limit.save();

  res.status(201).json({ success: true, message: "Rental limit set", data: limit });
});
// approve the videos of the vendor 
router.put('/video-status/:videoId', verifyAdmin, async (req, res) => {
  const videoId = req.params.videoId;
  const adminId = req.admin.id;
  const { status, approvalNote } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Use "approved" or "rejected".' });
  }

  try {
    const video = await Video.findById(videoId).populate('vendor_id', 'email name');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // ⚠️ If already approved and again trying to approve
    if (video.isApproved && status === "approved") {
      return res.status(200).json({
        message: 'Video is already approved. No changes made.',
        adminId,
        video
      });
    }

    const vendorEmail = video.vendor_id?.email;
    const vendorName = video.vendor_id?.name || vendorEmail;
    const videoTitle = video.name || 'your video';
    const note = approvalNote ? `\n\nNote from Admin: ${approvalNote}` : '';

    const subject = status === 'approved'
      ? 'Your video has been approved!'
      : 'Your video has been rejected';

    const emailBody =
      status === 'approved'
        ? `Hi ${vendorName},\n\nYour video titled "${videoTitle}" has been approved and is now live on the platform.${note}\n\nRegards,\nAdmin Team`
        : `Hi ${vendorName},\n\nWe regret to inform you that your video titled "${videoTitle}" has been rejected.${note}\n\nYou may update and re-submit it.\n\nRegards,\nAdmin Team`;

    if (vendorEmail) {
      try {
        await sendEmail(vendorEmail, subject, emailBody);
      } catch (error) {
        console.error('Email sending failed:', error.message);
        return res.status(500).json({ message: 'Email failed, approval not saved.' });
      }
    }

    video.status = status;
    video.isApproved = status === "approved";
    video.approvalNote = approvalNote || '';
    video.approvalDate = new Date();
    video.approvedBy = adminId;

    await video.save();

    res.status(200).json({
      message: `Video ${status} successfully`,
      adminId,
      video
    });

  } catch (err) {
    console.error('Error updating video status:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
router.get('/admin-note/:videoId',  async (req, res) => {
  const videoId = req.params.videoId;
  try {
    const video = await Video.findById(videoId)
      .populate('vendor_id', 'name email')
      .populate('category_id','name')
      .populate('approvedBy', 'name email'); // Optional: get admin details
 
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    let adminNote = '';

    switch (video.status) {
      case 'pending':
        adminNote = 'Your video is under observation.';
        break;
      case 'approved':
        adminNote = 'Admin has approved your video.';
        break;
      case 'rejected':
        adminNote = video.approvalNote
          ? `Admin rejected your video. Reason: ${video.approvalNote}`
          : 'Admin rejected your video. No reason provided.';
        break;
      default:
        adminNote = 'No status available.';
    }

    res.status(200).json({
      videoId: video._id,
      title: video.name,
      status: video.status,
      isApproved: video.isApproved,
      adminNote,
      approvedBy: video.approvedBy || null,
      approvalDate: video.approvalDate || null
    });
  } catch (err) {
    console.error('Error fetching admin note:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// add sections 
// router.post('/add-section', async (req, res) => {
//   try {
//     const {
//       is_home_screen,
//       type_id,
//       video_type,
//       sub_video_type,
//       title,
//       short_title,
//       category_id,
//       language_id,
//       channel_id,
//       order_by_upload,
//       order_by_like,
//       order_by_view,
//       screen_layout,
//       premium_video,
//       rent_video,
//       no_of_content,
//       view_all,
//       sortable,
//       status
//     } = req.body;

//     const newSection = new HomeSection({
//       is_home_screen,
//       type_id,
//       video_type,
//       sub_video_type,
//       title,
//       short_title,
//       category_id,
//       language_id,
//       channel_id,
//       order_by_upload,
//       order_by_like,
//       order_by_view,
//       screen_layout,
//       premium_video,
//       rent_video,
//       no_of_content,
//       view_all,
//       sortable,
//       status
//     });

//     await newSection.save();

//     res.status(201).json({
//       message: 'Section created successfully',
//       data: newSection
//     });
//   } catch (error) {
//     console.error('Error adding section:', error);
//     res.status(500).json({ message: 'Internal Server Error', error });
//   }
// });
// router.post('/add-section', async (req, res) => {
//   try {
//     const {
//       is_home_screen,
//       type_id,
//       video_type,
//       sub_video_type,
//       title,
//       short_title,
//       category_id,
//       language_id,
//       channel_id,
//       order_by_upload,
//       order_by_like,
//       order_by_view,
//       screen_layout,
//       premium_video,
//       rent_video,
//       no_of_content,
//       view_all,
//       sortable,
//       status
//     } = req.body;
//     console.log("this is req body "+ req.body);
//     let videoQuery = {};

//     if (category_id) videoQuery.category_id = category_id;
//     if (language_id) videoQuery.language_id = language_id;
//     if (channel_id) videoQuery.channel_id = channel_id;
//     if (premium_video !== undefined) videoQuery.premium_video = premium_video;
//     if (rent_video !== undefined) videoQuery.rent_video = rent_video;
//     if (video_type) videoQuery.video_type = video_type;
//     if (sub_video_type) videoQuery.sub_video_type = sub_video_type;

//     const totalVideos = await Video.countDocuments(videoQuery);

//     let sortCriteria = {};

//     if (order_by_like) sortCriteria.likes = order_by_like === 'desc' ? -1 : 1;
//     else if (order_by_view) sortCriteria.views = order_by_view === 'desc' ? -1 : 1;
//     else if (order_by_upload) sortCriteria.upload_date = order_by_upload === 'desc' ? -1 : 1;
//     else sortCriteria.upload_date = -1;

//     const limitCount = Math.min(no_of_content || totalVideos, totalVideos);

//     const videos = await Video.find(videoQuery)
//       .sort(sortCriteria)
//       .limit(limitCount);
//       console.log("this is the video query "+" "+videoQuery);
//     // Better console log to see video objects:
//     console.log("this is videos:", videos);

//     // Step 4: Create the HomeSection entry
//     const newSection = new HomeSection({
//       is_home_screen,
//       type_id,
//       video_type,
//       sub_video_type,
//       title,
//       short_title,
//       category_id,
//       language_id,
//       channel_id,
//       order_by_upload,
//       order_by_like,
//       order_by_view,
//       screen_layout,
//       premium_video,
//       rent_video,
//       no_of_content: limitCount, // save the actual count used
//       view_all,
//       sortable,
//       status,
//       videos,  // assuming you want to store/embed video list here or you can omit it
//     });

//     await newSection.save();

//     // Step 5: Send response with message if videos less than requested
//     let message = 'Section created successfully';

//     if (totalVideos < (no_of_content || 0)) {
//       message = `Number of contents is less than requested, presenting only ${totalVideos} videos.`;
//     }

//     res.status(201).json({
//       message: totalVideos < (no_of_content || 0) 
//         ? `Number of contents is less than requested, presenting only ${totalVideos} videos.` 
//         : 'Section created successfully',
//       data: newSection,
//       videos
//     });
//   } catch (error) {
//     console.error('Error adding section:', error);
//     res.status(500).json({ message: 'Internal Server Error', error });
//   }
// });
// Route: Add new section
router.post('/add-section/:typeName',verifyAdmin, async (req, res) => {
  try {
    const { typeName } = req.params;

    // 🔍 Case-insensitive type search
    const type = await Type.findOne({ name: new RegExp(`^${typeName}$`, 'i') });

    if (!type) {
      return res.status(404).json({ message: 'Type not found' });
    }

    const {
      is_home_screen,
      video_type,
      sub_video_type,
      title,
      short_title,
      category_id,
      language_id,
      channel_id,
      order_by_upload,
      order_by_like,
      order_by_view,
      screen_layout,
      premium_video,
      rent_video,
      no_of_content = 3,
      view_all,
      sortable,
      status
    } = req.body;

    const videoQuery = {
      type_id: type._id,
      ...(category_id && { category_id }),
      ...(language_id && { language_id }),
      ...(channel_id && { channel_id }),
      status: 'approved',
      isApproved: true,
    };
    console.log('Video query:', videoQuery);


    // 🔃 Sorting logic
    const sortCriteria = {};
    if (order_by_like) sortCriteria.total_like = order_by_like === 'desc' ? -1 : 1;
    else if (order_by_view) sortCriteria.total_view = order_by_view === 'desc' ? -1 : 1;
    else if (order_by_upload) sortCriteria.createdAt = order_by_upload === 'desc' ? -1 : 1;
    else sortCriteria.createdAt = -1;

    const totalVideos = await Video.countDocuments(videoQuery);
    const limitCount = Math.min(no_of_content, totalVideos);

    const videos = await Video.find(videoQuery)
      .sort(sortCriteria)
      .limit(limitCount)
      .select('_id');
   console.log("videos "+" "+videos)
    // 🧱 Create new home section
    const newSection = new HomeSection({
      is_home_screen,
      type_id: type._id,
      video_type,
      sub_video_type,
      title,
      short_title,
      category_id,
      language_id,
      channel_id,
      order_by_upload,
      order_by_like,
      order_by_view,
      screen_layout,
      premium_video,
      rent_video,
      no_of_content: limitCount,
      view_all,
      sortable,
      status,
      videos: videos.map(v => v._id)
    });

    await newSection.save();

    return res.status(201).json({
      message: totalVideos < no_of_content
        ? `Only ${totalVideos} videos matched the criteria. Section created with available videos.`
        : 'Section created successfully',
      data: newSection
    });
  } catch (error) {
    console.error('Error adding section:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});
router.get('/sections', async (req, res) => {
  try {
    const sections = await HomeSection.find()
      .populate('type_id', 'name')        // Assuming `Type` model has `name`
      .populate('category_id', 'name')
      .populate('language_id', 'name')
      .populate('channel_id', 'name')
      .populate('videos')
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
// Route to update a section by id (equivalent to update)
router.put('/update-section/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      is_home_screen,
      type_id,
      video_type,
      sub_video_type,
      title,
      short_title,
      category_id,
      language_id,
      channel_id,
      order_by_upload,
      order_by_like,
      order_by_view,
      screen_layout,
      premium_video,
      rent_video,
      no_of_content,
      view_all,
      sortable,
      status
    } = req.body;

    let videoQuery = {};
    if (category_id) videoQuery.category_id = category_id;
    if (language_id) videoQuery.language_id = language_id;
    if (channel_id) videoQuery.channel_id = channel_id;
    if (premium_video !== undefined) videoQuery.premium_video = premium_video;
    if (rent_video !== undefined) videoQuery.rent_video = rent_video;
    if (video_type) videoQuery.video_type = video_type;
    if (sub_video_type) videoQuery.sub_video_type = sub_video_type;

    const totalVideos = await Video.countDocuments(videoQuery);

    let sortCriteria = {};
    if (order_by_like) sortCriteria.likes = order_by_like === 'desc' ? -1 : 1;
    else if (order_by_view) sortCriteria.views = order_by_view === 'desc' ? -1 : 1;
    else if (order_by_upload) sortCriteria.upload_date = order_by_upload === 'desc' ? -1 : 1;
    else sortCriteria.upload_date = -1;

    const limitCount = Math.min(no_of_content || totalVideos, totalVideos);

    const videos = await Video.find(videoQuery)
      .sort(sortCriteria)
      .limit(limitCount);

    const updatedData = {
      is_home_screen,
      type_id,
      video_type,
      sub_video_type,
      title,
      short_title,
      category_id,
      language_id,
      channel_id,
      order_by_upload,
      order_by_like,
      order_by_view,
      screen_layout,
      premium_video,
      rent_video,
      no_of_content: limitCount,
      view_all,
      sortable,
      status,
      videos,
    };

    const updatedSection = await HomeSection.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedSection) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json({
      message: totalVideos < (no_of_content || 0)
        ? `Number of contents is less than requested, presenting only ${totalVideos} videos.`
        : 'Section updated successfully',
      data: updatedSection,
      videos
    });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});
// Admin gets all withdrawal requests
router.get('/all-requests', verifyAdmin, async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find()
      .populate('vendor', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin processes withdrawal request
router.put('/process-request/:requestId', verifyAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const withdrawalRequest = await WithdrawalRequest.findById(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Withdrawal request not found' 
      });
    }

    const vendor = await Vendor.findById(withdrawalRequest.vendor);
    if (!vendor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }

    withdrawalRequest.status = status;
    withdrawalRequest.remarks = remarks;

    if (status === 'approved') {
      // Remove amount from locked balance
      vendor.lockedBalance -= withdrawalRequest.amount;
      withdrawalRequest.withdrawalDate = new Date();
    } else if (status === 'rejected') {
      // Return amount to wallet
      vendor.wallet += withdrawalRequest.amount;
      vendor.lockedBalance -= withdrawalRequest.amount;
    }

    await withdrawalRequest.save();
    await vendor.save();

    res.json({
      success: true,
      message: `Withdrawal request ${status} successfully`,
      data: withdrawalRequest
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// Route: Admin sets/updates lock period for a vendor
// Route: Admin sets/updates lock period for a vendor
router.post('/set-vendor-lock', verifyAdmin, async (req, res) => {
  try {
    const { vendorId, lockPeriodDays, reason } = req.body;
    const adminId = req.admin.id; // from auth middleware

    // Validate input
    if (!vendorId || !lockPeriodDays || lockPeriodDays < 1) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID and a lock period of at least 1 day are required'
      });
    }

    // Ensure vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Look for an existing lock
    let lock = await VendorLockPeriod.findOne({ vendorId });

    if (lock) {
      // Update existing
      lock.lockPeriodDays = lockPeriodDays;
      lock.reason = reason?.trim() || lock.reason;
      lock.adminId = adminId;
      lock.isActive = true;
      lock.startDate = new Date(); // reset
      await lock.save();
       console.log("lock "+lock);
      // Populate refs
      await lock.populate([
        { path: 'vendorId', select: 'username fullName email wallet lockedBalance' },
        { path: 'adminId',  select: 'email role' }
      ]);

      return res.status(200).json({
        success: true,
        message: 'Vendor lock period updated successfully',
        data: {
          lockPeriod: lock,
          vendor: {
            username: lock.vendorId.username,
            currentWallet: lock.vendorId.wallet,
            currentLockedBalance: lock.vendorId.lockedBalance
          }
        }
      });
    }

    // Create new lock period
    lock = new VendorLockPeriod({
      vendorId,
      adminId,
      lockPeriodDays,
      reason: reason?.trim() || undefined
    });
    console.log("venodr lock period"+lock);
    try {
      await lock.save();
    } catch (err) {
      // Handle duplicate‐key (race condition) gracefully
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'A lock period already exists for this vendor'
        });
      }
      throw err;
    }

    await lock.populate([
      { path: 'vendorId', select: 'username fullName email wallet lockedBalance' },
      { path: 'adminId',  select: 'email role' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Vendor lock period set successfully',
      data: {
        lockPeriod: lock,
        vendor: {
          username: lock.vendorId.username,
          currentWallet: lock.vendorId.wallet,
          currentLockedBalance: lock.vendorId.lockedBalance
        }
      }
    });

  } catch (error) {
    console.error('Error setting vendor lock period:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
// Route: Admin gets all vendor lock periods with pagination
// Route: Admin gets all vendor lock periods with pagination
router.get('/vendor-lock-periods',verifyAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { status, vendorId, search } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status === 'active') {
      query = { isActive: true, endDate: { $gt: new Date() } };
    } else if (status === 'expired') {
      query = { $or: [{ isActive: false }, { endDate: { $lte: new Date() } }] };
    }
    
    // Filter by specific vendor
    if (vendorId) {
      query.vendorId = vendorId;
    }

    const lockPeriods = await VendorLockPeriod.find(query)
      .populate('vendorId', 'username fullName email wallet lockedBalance')
      .populate('adminId', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await VendorLockPeriod.countDocuments(query);

    // Add remaining days and status to each lock period
    const lockPeriodsWithDetails = lockPeriods.map(lock => ({
      ...lock.toObject(),
      remainingDays: lock.getRemainingDays(),
      isCurrentlyActive: lock.isLockActive(),
      vendor: {
        ...lock.vendorId.toObject(),
        totalBalance: lock.vendorId.wallet + lock.vendorId.lockedBalance
      }
    }));

    res.status(200).json({
      success: true,
      data: {
        lockPeriods: lockPeriodsWithDetails,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching vendor lock periods:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});
// approve a series 
// Approve series by admin
// PATCH /admin/series/approve/:id
router.patch('/series/approve/:id', verifyAdmin, async (req, res) => {
  try {
    const seriesId = req.params.id;
    const { status, adminNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const series = await Series.findById(seriesId);
    if (!series) return res.status(404).json({ success: false, message: 'Series not found' });

    series.approvalStatus = status;
    series.isApproved = status === 'approved';
    series.approvedBy = req.admin.id; // assuming req.admin is set by isAdmin middleware
    series.adminNotes = adminNotes || '';

    await series.save();

    // Optionally send email here using nodemailer or emailjs

    return res.status(200).json({ success: true, message: `Series ${status}` });
  } catch (error) {
    console.error('Error approving/rejecting series:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});
//approve a tv show 
// PUT /admin/tvshows/:id/approval
router.put('/admin/tvshows/:id/approval', verifyAdmin, async (req, res) => {
  const { status, notes } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid approval status' });
  }

  try {
    const tvShow = await TVShow.findById(req.params.id);
    if (!tvShow) {
      return res.status(404).json({ success: false, error: 'TV Show not found' });
    }

    tvShow.approvalStatus = status;
    tvShow.isApproved = (status === 'approved');
    tvShow.approvalNotes = notes || '';

    await tvShow.save();

    res.json({
      success: true,
      message: `TV Show has been ${status}`,
      tvShow
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update approval status',
      details: error.message
    });
  }
});







// transactions 


// const calculateRemainingLockDays = (vendor) => {
//   if (!vendor.walletLockStartDate || !vendor.walletLockDays) {
//     return 0;
//   }
  
//   const lockStartDate = new Date(vendor.walletLockStartDate);
//   const currentDate = new Date();
//   const daysPassed = Math.floor((currentDate - lockStartDate) / (1000 * 60 * 60 * 24));
//   const remainingDays = Math.max(0, vendor.walletLockDays - daysPassed);
  
//   return remainingDays;
// };

// router.get('/withdrawals-requests',verifyAdmin, async (req, res) => {
//   try {
//     const { status, page = 1, limit = 10 } = req.query;
//     const filter = {};

//     if (status) {
//       filter.status = status;
//     }

//     const requests = await VendorsWithdrawalRequest.find(filter)
//       .populate('vendorId', 'username fullName email mobile wallet')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await VendorsWithdrawalRequest.countDocuments(filter);

//     res.json({
//       success: true,
//       data: {
//         requests,
//         pagination: {
//           current: page,
//           pages: Math.ceil(total / limit),
//           total
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching withdrawal requests:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// });
// router.put('/withdrawals/:requestId/process', async (req, res) => {
//   try {
//     const { requestId } = req.params;
//     const { action, adminNotes, rejectionReason } = req.body;

//     if (!['approve', 'reject'].includes(action)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid action. Must be approve or reject'
//       });
//     }

//     const request = await VendorsWithdrawalRequest.findById(requestId).populate('vendorId');

//     if (!request) {
//       return res.status(404).json({
//         success: false,
//         message: 'Withdrawal request not found'
//       });
//     }

//     if (request.status !== 'pending') {
//       return res.status(400).json({
//         success: false,
//         message: 'Request has already been processed'
//       });
//     }

//     const vendor = request.vendorId;
//     const remainingDays = calculateRemainingLockDays(vendor);

//     if (action === 'approve') {
//       if (remainingDays > 0) {
//         return res.status(400).json({
//           success: false,
//           message: `Cannot approve. Wallet is locked for ${remainingDays} more days`
//         });
//       }

//       if (vendor.wallet < request.amount) {
//         return res.status(400).json({
//           success: false,
//           message: 'Vendor has insufficient balance'
//         });
//       }

//       request.status = 'approved';
//       request.approvalDate = new Date();
//       request.adminNotes = adminNotes;
//       request.canWithdraw = true;

//       vendor.wallet -= request.amount;
//       await vendor.save();
//       await request.save();

//       res.json({
//         success: true,
//         message: 'Withdrawal request approved successfully',
//         data: request
//       });
//     } else {
//       request.status = 'rejected';
//       request.rejectionReason = rejectionReason;
//       request.adminNotes = adminNotes;

//       await request.save();

//       res.json({
//         success: true,
//         message: 'Withdrawal request rejected successfully',
//         data: request
//       });
//     }
//   } catch (error) {
//     console.error('Error processing withdrawal request:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// });
// router.patch('/withdrawals/:requestId/complete', async (req, res) => {
//   try {
//     const { requestId } = req.params;
//     const { adminNotes } = req.body;

//     const request = await VendorsWithdrawalRequest.findById(requestId);

//     if (!request) {
//       return res.status(404).json({
//         success: false,
//         message: 'Withdrawal request not found'
//       });
//     }

//     if (request.status !== 'approved') {
//       return res.status(400).json({
//         success: false,
//         message: 'Request must be approved before marking as completed'
//       });
//     }

//     request.status = 'completed';
//     request.completionDate = new Date();
//     if (adminNotes) request.adminNotes = adminNotes;

//     await request.save();

//     res.json({
//       success: true,
//       message: 'Withdrawal marked as completed successfully',
//       data: request
//     });
//   } catch (error) {
//     console.error('Error marking withdrawal as completed:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// });
// router.post('/vendors/:vendorId/lock', async (req, res) => {
//   try {
//     const { vendorId } = req.params;
//     const { lockDays } = req.body;

//     if (!lockDays || lockDays < 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Lock days must be a positive number'
//       });
//     }

//     const vendor = await Vendor.findById(vendorId);
//     if (!vendor) {
//       return res.status(404).json({
//         success: false,
//         message: 'Vendor not found'
//       });
//     }

//     vendor.walletLockDays = lockDays;
//     vendor.walletLockStartDate = new Date();
//     await vendor.save();

//     res.json({
//       success: true,
//       message: `Vendor wallet locked for ${lockDays} days`,
//       data: {
//         vendorId,
//         lockDays,
//         lockStartDate: vendor.walletLockStartDate
//       }
//     });
//   } catch (error) {
//     console.error('Error setting wallet lock:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// });
// Calculate remaining lock days for vendor
const calculateRemainingLockDays = (vendor) => {
  if (!vendor.walletLockEndDate) {
    return 0;
  }
  
  const currentDate = new Date();
  const endDate = new Date(vendor.walletLockEndDate);
  
  // If current date is past end date, no lock remaining
  if (currentDate >= endDate) {
    return 0;
  }
  
  // Calculate remaining days
  const remainingMs = endDate.getTime() - currentDate.getTime();
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  
  return Math.max(0, remainingDays);
};
router.get('/withdrawals',  verifyAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const requests = await VendorsWithdrawalRequest.find(filter)
      .populate('vendorId', 'username fullName email mobile wallet')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await VendorsWithdrawalRequest.countDocuments(filter);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/withdrawals/:requestId/process', verifyAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, adminNotes, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be approve or reject' });
    }

    const request = await VendorsWithdrawalRequest.findById(requestId).populate('vendorId');
    if (!request) return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Request already processed' });

    const vendor = request.vendorId;
    const remainingDays = calculateRemainingLockDays(vendor);

    if (action === 'approve') {
      if (remainingDays > 0) {
        return res.status(400).json({ success: false, message: `Wallet locked for ${remainingDays} more days` });
      }
      if (vendor.wallet < request.amount) {
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }

      request.status = 'approved';
      request.approvalDate = new Date();
      request.adminNotes = adminNotes;
      request.canWithdraw = true;

      vendor.wallet -= request.amount;
      await vendor.save();
      await request.save();

      return res.json({ success: true, message: 'Approved successfully', data: request });
    }

    request.status = 'rejected';
    request.rejectionReason = rejectionReason;
    request.adminNotes = adminNotes;
    await request.save();

    res.json({ success: true, message: 'Rejected successfully', data: request });
  } catch (error) {
    console.error('Error processing withdrawal request:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
router.post('/withdrawals/:requestId/complete',verifyAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;

    const request = await VendorsWithdrawalRequest.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    if (request.status !== 'approved') return res.status(400).json({ success: false, message: 'Must be approved before completing' });

    request.status = 'completed';
    request.completionDate = new Date();
    if (adminNotes) request.adminNotes = adminNotes;

    await request.save();

    res.json({ success: true, message: 'Marked as completed', data: request });
  } catch (error) {
    console.error('Error completing withdrawal:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
router.post('/vendors/:vendorId/lock-wallet', verifyAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { startDate, endDate, lockDays } = req.body;

    if ((!startDate || !endDate) && !lockDays) {
      return res.status(400).json({ success: false, message: 'Provide start/end dates or lockDays' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    let lockStartDate, lockEndDate;

    if (startDate && endDate) {
      lockStartDate = new Date(startDate);
      lockEndDate = new Date(endDate);

      if (lockStartDate >= lockEndDate) {
        return res.status(400).json({ success: false, message: 'End date must be after start date' });
      }

      const days = Math.ceil((lockEndDate - lockStartDate) / (1000 * 60 * 60 * 24));
      vendor.walletLockStartDate = lockStartDate;
      vendor.walletLockEndDate = lockEndDate;
      vendor.walletLockDays = days;
    } else {
      if (lockDays <= 0) {
        return res.status(400).json({ success: false, message: 'Lock days must be positive' });
      }

      lockStartDate = new Date();
      lockEndDate = new Date();
      lockEndDate.setDate(lockEndDate.getDate() + lockDays);

      vendor.walletLockStartDate = lockStartDate;
      vendor.walletLockEndDate = lockEndDate;
      vendor.walletLockDays = lockDays;
    }

    await vendor.save();

    res.json({
      success: true,
      message: 'Wallet lock set',
      data: {
        vendorId,
        lockStartDate: vendor.walletLockStartDate,
        lockEndDate: vendor.walletLockEndDate,
        lockDays: vendor.walletLockDays,
        remainingDays: calculateRemainingLockDays(vendor)
      }
    });
  } catch (error) {
    console.error('Error setting wallet lock:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
router.delete('/vendors/:vendorId/unlock-wallet', verifyAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    vendor.walletLockStartDate = null;
    vendor.walletLockEndDate = null;
    vendor.walletLockDays = 0;

    await vendor.save();

    res.json({
      success: true,
      message: 'Wallet lock removed',
      data: {
        vendorId,
        walletUnlocked: true
      }
    });
  } catch (error) {
    console.error('Error unlocking wallet:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
router.get('/vendors/:vendorId/lock-status', verifyAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const remainingDays = calculateRemainingLockDays(vendor);
    const canWithdraw = canVendorWithdraw(vendor);

    res.json({
      success: true,
      data: {
        vendorId,
        vendorName: vendor.fullName,
        walletBalance: vendor.wallet,
        lockStartDate: vendor.walletLockStartDate,
        lockEndDate: vendor.walletLockEndDate,
        totalLockDays: vendor.walletLockDays,
        remainingDays,
        canWithdraw,
        isLocked: remainingDays > 0
      }
    });
  } catch (error) {
    console.error('Error getting lock status:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 1. CREATE CONTEST (Admin only)
router.post('/create-contests',verifyAdmin, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      rules, 
      judgingCriteria,
      type_id, 
      startDate, 
      endDate, 
      registrationStartDate,
      registrationEndDate,
      prizes 
    } = req.body;

    // Validate dates
    const regStart = new Date(registrationStartDate);
    const regEnd = new Date(registrationEndDate);
    const contestStart = new Date(startDate);
    const contestEnd = new Date(endDate);

    if (regStart >= regEnd || regEnd >= contestStart || contestStart >= contestEnd) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date sequence. Registration should be before contest period.' 
      });
    }

    const contest = new Contest({
      title,
      description,
      rules,
      judgingCriteria,
      type_id,
      startDate: contestStart,
      endDate: contestEnd,
      registrationStartDate: regStart,
      registrationEndDate: regEnd,
      prizes,
      createdBy: req.admin.id // Assuming admin auth middleware
    });

    await contest.save();
    res.status(201).json({ success: true, data: contest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// 2. GET ALL CONTESTS
router.get('/contests', async (req, res) => {
  try {
    const { status, type_id } = req.query;
    let filter = {};
    
    if (status) filter.status = status;
    if (type_id) filter.type_id = type_id;

    const contests = await Contest.find(filter)
      .populate('type_id')
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: contests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// 3. GET CONTEST BY ID
router.get('/contests/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('type_id')
      .populate('createdBy', 'email')
      .populate('participants.vendor_id', 'username fullName')
      .populate('participants.video_id', 'title description');

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    res.json({ success: true, data: contest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// 4. UPDATE CONTEST (Admin only)
router.put('/contests/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    // Don't allow certain changes if contest is active
    if (contest.status === 'active' && (req.body.startDate || req.body.endDate)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change dates of an active contest' 
      });
    }

    Object.assign(contest, req.body);
    await contest.save();

    res.json({ success: true, data: contest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// admin approves the regsitrations of the vendor for contest
// 6. ADMIN APPROVE/REJECT REGISTRATION
router.put('/contests/:id/registrations/:registrationId',verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const contest = await Contest.findById(req.params.id);
    
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    const registration = contest.registrations.id(req.params.registrationId);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    registration.status = status;
    await contest.save();

    res.json({ success: true, message: `Registration ${status} successfully`, data: registration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
//updated the views
// 8. UPDATE CONTEST VIEWS (Admin only - can only increase)
router.put('/contests/:id/participants/:participantId/views', verifyAdmin,async (req, res) => {
  try {
    const { viewsToAdd, note } = req.body;
    
    if (!viewsToAdd || viewsToAdd <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Views to add must be a positive number' 
      });
    }

    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    const participant = contest.participants.id(req.params.participantId);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    // Update views
    participant.adminAdjustedViews += parseInt(viewsToAdd);
    participant.totalContestViews = participant.contestViews + participant.adminAdjustedViews;

    // Add to history
    contest.viewsUpdateHistory.push({
      vendor_id: participant.vendor_id,
      video_id: participant.video_id,
      viewsAdded: parseInt(viewsToAdd),
      updatedBy: req.admin.id,
      note: note || 'Admin adjustment'
    });

    await contest.save();

    res.json({ 
      success: true, 
      message: `Added ${viewsToAdd} views successfully`,
      data: participant 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// 9. UPDATE CONTEST RANKINGS
router.post('/contests/:id/update-rankings', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    // Sort participants by total contest views (descending)
    contest.participants.sort((a, b) => b.totalContestViews - a.totalContestViews);

    // Assign rankings
    contest.participants.forEach((participant, index) => {
      participant.rank = index + 1;
    });

    await contest.save();

    res.json({ 
      success: true, 
      message: 'Rankings updated successfully',
      data: contest.participants 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 10. GET CONTEST LEADERBOARD
router.get('/contests/:id/leaderboard', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('participants.vendor_id', 'username fullName image')
      .populate('participants.video_id', 'title description thumbnail');

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    // Sort by rank
    const leaderboard = contest.participants
      .sort((a, b) => a.rank - b.rank)
      .map(participant => ({
        rank: participant.rank,
        vendor: participant.vendor_id,
        video: participant.video_id,
        totalContestViews: participant.totalContestViews,
        contestViews: participant.contestViews,
        adminAdjustedViews: participant.adminAdjustedViews
      }));

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// 11. END CONTEST
router.post('/contests/:id/end', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    contest.status = 'completed';
    await contest.save();

    res.json({ success: true, message: 'Contest ended successfully', data: contest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 13. GET CONTEST VIEWS UPDATE HISTORY
router.get('/contests/:id/views-history', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('viewsUpdateHistory.vendor_id', 'username')
      .populate('viewsUpdateHistory.video_id', 'title')
      .populate('viewsUpdateHistory.updatedBy', 'email');

    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    res.json({ success: true, data: contest.viewsUpdateHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
