const express = require('express');
const nodemailer = require("nodemailer");
const { uploadToCloudinary } = require("../utils/cloudinary");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const User = require('../models/User');
const Category = require("../models/Category")
const JWT_SECRET = process.env.JWT_SECRET || "Apple";
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail'); 
// const { protect,verifyToken } = require('../middleware/auth');
const { protect , verifyAdmin, isVendor } = require("../middleware/auth");
const { body, validationResult } = require('express-validator');
const multer = require("multer");
const storage = multer.memoryStorage();
const PDFDocument = require("pdfkit");
const cloudinary = require("../utils/cloudinary");
const upload = multer({ storage: storage });
const Language = require('../models/Language');
dotenv.config();
const router = express.Router();
const fs = require("fs");
const Admin = require("../models/Admin");
const path = require("path");
const Movie = require("../models/Movie");
const downloadsDir = path.join(__dirname, "../downloads");
const Type = require("../models/Type");
const bcrypt = require('bcrypt');
const Vendor = require('../models/Vendor');
const Cast = require("../models/Cast");
const sendMail = require('../utils/sendEmail');
const generateRandomUsername = () => `vendor_${crypto.randomBytes(4).toString('hex')}`;
const generateRandomPassword = () => crypto.randomBytes(6).toString('hex');
const Content = require("../models/Content");
const UpcomingContent = require("../models/UpcomingContent");
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true }); // Creates folder if missing
}
// Admin Login (Dynamically Generated OTP)
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
// // Middleware to verify admin token

// ✅ Sign Up Admin (only email)
router.post('/signup', async (req, res) => {
    // console.log(req.body)
    try {
      const { email } = req.body;
  
      let existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin already exists' });
      }
  
      const newAdmin = new Admin({ email });
      await newAdmin.save();
  
      res.status(201).json({ message: 'Admin signed up successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
// ✅ Send OTP
router.post('/send-otp', async (req, res) => {
    try {
      const { email } = req.body;
  
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  
      admin.otp = otp;
      admin.otpExpiry = otpExpiry;
      await admin.save();
  
      await sendOTPEmail(email, otp);
  
      res.status(200).json({ message: 'OTP sent to email' });
    } catch (err) {
      res.status(500).json({ message: 'Error sending OTP', error: err.message });
    }
  });
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
  
      admin.otp = null;
      admin.otpExpiry = null;
      await admin.save();
  
      const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
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

// router.post(
//     "/addCategory",
//     upload.single("icon"),
//     [
//         body("name").notEmpty().withMessage("Name is required").trim(),
//         body("description").optional().trim(),
//         body("displayOrder").isNumeric().optional()
//     ],
//     async (req, res) => {
//         try {
//             const errors = validationResult(req);
//             if (!errors.isEmpty()) {
//                 return res.status(400).json({ status: 400, errors: errors.array() });
//             }

//             const { name, description, isActive, displayOrder, parentCategory } = req.body;
//             let iconUrl = null;

//             if (req.file) {
//                 iconUrl = await uploadToCloudinary(req.file.path, "categories");
//             }

//             const category = new Category({
//                 name,
//                 description,
//                 icon: iconUrl,
//                 isActive,
//                 displayOrder,
//                 parentCategory: parentCategory || null
//             });

//             await category.save();
//             res.status(201).json({ status: 201, success: "Category added successfully", category });
//         } catch (error) {
//             res.status(500).json({ status: 500, errors: error.message });
//         }
//     }
// );
// ✅ Add new category with icon upload
// router.post('/add-category', verifyAdmin, upload.single('icon'), async (req, res) => {
//     try {
//       const { name, description, displayOrder } = req.body;
  
//       const existing = await Category.findOne({ name });
//       if (existing) {
//         return res.status(400).json({ message: 'Category already exists' });
//       }
  
//       const icon = req.file?.path || null;
  
//       const category = new Category({
//         name,
//         description,
//         icon,
//         displayOrder,
//       });
  
//       await category.save();
  
//       res.status(201).json({ message: 'Category created successfully', category });
//     } catch (err) {
//       res.status(500).json({ message: 'Failed to create category', error: err.message });
//     }
//   });
router.post('/add-category', verifyAdmin, upload.single('icon'), async (req, res) => {
  try {
    const { name, description, displayOrder } = req.body;

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Icon image is required' });
    }

    // Upload icon to Cloudinary
    const iconUrl = await uploadToCloudinary(
      req.file.buffer,
      "category_icons", // cloudinary folder
      req.file.mimetype
    );

    const category = new Category({
      name,
      description,
      icon: iconUrl, // Save Cloudinary URL instead of local path
      displayOrder,
    });

    await category.save();

    res.status(201).json({ message: 'Category created successfully', category });
  } catch (err) {
    console.error("Add Category Error:", err);
    res.status(500).json({ message: 'Failed to create category', error: err.message });
  }
});
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
router.delete("/:id", async (req, res) => {
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
// Fetch all categories (with optional search)
router.get("/categories", async (req, res) => {
    try {
        const { input_search } = req.query;
        let query = {};

        if (input_search) {
            query.name = { $regex: input_search, $options: "i" };
        }

        const categories = await Category.find(query).sort({ displayOrder: 1 });

        res.status(200).json({ status: 200, data: categories });
    } catch (error) {
        res.status(500).json({ status: 500, errors: error.message });
    }
});
// Add a new movie (Admin Only)
// router.put('/approve/:id', protect , async (req, res) => {
//     try {
//       const { status, adminRemarks } = req.body;
//       if (!['approved', 'rejected'].includes(status)) {
//         return res.status(400).json({ error: 'Invalid status' });
//       }
  
//       const movie = await Movie.findById(req.params.id);
//       if (!movie) {
//         return res.status(404).json({ error: 'Movie not found' });
//       }
  
//       movie.status = status;
//       movie.adminRemarks = adminRemarks;
//       await movie.save();
  
//       res.json({ message: `Movie ${status}`, movie });
//     } catch (error) {
//       res.status(500).json({ error: 'Server error' });
//     }
//   });
router.post('/type', verifyAdmin, async (req, res) => {
    const fixedTypes = ['video', 'show', 'upcoming', 'channel', 'kids','webSeries','shortVideos'];

    try {
      const { type, name, isVisible } = req.body;
  
      if (!fixedTypes.includes(type)) {
        return res.status(400).json({ message: `Invalid type. Must be one of: ${fixedTypes.join(', ')}` });
      }
  
      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }
  
      const newType = new Type({
        type,
        name,
        isVisible: isVisible !== undefined ? isVisible : true
      });
  
      await newType.save();
  
      res.status(201).json({ message: 'Type added successfully', data: newType });
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  });
  // ✅ Add Language
router.post('/add-language', upload.single('image'), async (req, res) => {
    console.log(req.body);
    console.log(req.file)
    try {
      const { name } = req.body;
  
      if (!name || !req.file) {
        return res.status(400).json({ message: 'Name and image are required' });
      }
      if (req.file) {
        const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        var imageUrl = await uploadToCloudinary(base64, "image", req.file.mimetype);
    console.log(imageUrl)
  }

  
      const existing = await Language.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({ message: 'Language already exists' });
      }
  
      // Upload image to cloudinary
      // const result = await cloudinary.uploader.upload(req.file.path, {
      //   folder: 'languages'
      // });
  
      // Delete local file after upload
      // fs.unlinkSync(req.file.path);
  
      // Create language with image URL
      const newLanguage = new Language({
        name: name.trim(),
        image: imageUrl
      });
  
      await newLanguage.save();
  
      res.status(201).json({
        message: 'Language added successfully',
        language: newLanguage
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
  // add vendor 
router.post('/add-vendor', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
      const { fullName, email, mobile } = req.body;
      const file = req.file;
  
      if (!fullName || !email || !mobile || !file) {
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
        mobile: mobile.trim(),
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
router.post('/add-cast', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
      const { name, role } = req.body;
      const file = req.file;
  
      if (!name || !role) {
        return res.status(400).json({ message: "Name and role are required" });
      }
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      const cloudinaryResult = await uploadToCloudinary(base64, "image", file.mimetype);
  
      const newCast = new Cast({
        name,
        role,
        image: cloudinaryResult.secure_url
      });
  
      const savedCast = await newCast.save();
      res.status(201).json({ message: "Cast member added successfully", cast: savedCast });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  });
// approving the videos of  uploaded by the vendor 
router.put('/videos/:id/status', async (req, res) => {
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('category', 'name')
      .populate('type', 'name')
      .populate('language', 'name')
      .populate('cast', 'name image')
      .populate('uploadedBy', 'name email');

    if (!content) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // ✉️ Send mail to vendor
    const vendorEmail = content.uploadedBy.email;
    
    const videoTitle = content.title;
    
    let emailBody = '';

    if (status === 'approved') {
      emailBody =
        `Hi ${vendorEmail},\n\n` +
        `We're excited to let you know that your video titled "${videoTitle}" has been approved and is now live on the platform.\n\n` +
        `Thank you for your contribution!\n\n` +
        `Best Regards,\nAdmin Team`;
    } else if (status === 'rejected') {
      emailBody =
        `Hi ${vendorEmail},\n\n` +
        `We appreciate your effort in submitting the video titled "${videoTitle}".\n\n` +
        `However, after review, it did not meet the content guidelines of our platform and has been rejected.\n\n` +
        `You’re welcome to review our policies and try uploading again with suitable adjustments.\n\n` +
        `Best Regards,\nAdmin Team`;
    }

    await sendMail(
      vendorEmail,
      status === 'approved' ? 'Your video has been approved!' : 'Video Rejection Notification',
      emailBody
    );

    res.status(200).json({
      message: `Video status updated to ${status}`,
      content
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
router.get('/admin/users', async (req, res) => {
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
router.get('/admin/movies', async (req, res) => {
  try {
    const movies = await Content.find({ status: 'approved' }).select('title');

    res.status(200).json({ movies });
  } catch (err) {
    console.error('Error fetching movies:', err);
    res.status(500).json({ message: 'Server error while fetching movies' });
  }
});
// top 10 movies 
router.put('/admin/top10-movies/add', async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Movie title is required' });
  }

  try {
    // Check if 10 movies are already marked as top 10
    const currentTop10 = await Content.countDocuments({ isTop10: true });
    if (currentTop10 >= 10) {
      return res.status(400).json({ message: 'Top 10 list already full. Remove one before adding.' });
    }

    const movie = await Content.findOneAndUpdate(
      { title, status: 'approved' },
      { $set: { isTop10: true } },
      { new: true }
    );

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found or not approved' });
    }

    res.status(200).json({
      message: `"${movie.title}" has been added to the Top 10 list.`,
      movie
    });
  } catch (err) {
    console.error('Error updating top 10 movie:', err);
    res.status(500).json({ message: 'Server error while updating top 10 movie' });
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
router.post('/upcoming-banners', upload.single('banner'), async (req, res) => {
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

module.exports = router;