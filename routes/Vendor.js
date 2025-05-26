const express = require('express');
const Admin = require("../models/Admin");
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const VendorLockPeriod = require('../models/LockPeriod'); // adjust the path as needed
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Shorts = require('../models/Short'); // Adjust path as needed
const TVShow = require("../models/TVShow")
const Contest = require("../models/Contest")
const router = express.Router();
const heicConvert = require('heic-convert');

const { createWithdrawalRequest ,getVendorWithdrawalRequests, getVendorWalletInfo} = require('../controllers/vendorsWithdraws');

// const  getVendorWithdrawalRequests  = require('../controllers/vendorsWithdraws');
// const getVendorWalletInfo =require('../controllers/vendorsWithdraws');
const multer = require('multer');
const RentalLimit = require("../models/RentalLimit");
const cloudinary = require('cloudinary').v2;
const TVSeason = require("../models/Tvshowsseason")
const TvEpisode = require('../models/TvshowEpisode');
const { uploadToCloudinary } = require("../utils/cloudinary");
const storage = multer.memoryStorage();
const Series = require('../models/Series');
const Type = require("../models/Type")
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const Setting = require("../models/LikesSetting");
const finalPackage = require("../models/FinalPackage");
const {isVendor}= require("../middleware/auth")
const upload = multer({ storage: storage });
const Vendor = require("../models/Vendor");
const crypto = require('crypto');
const DEFAULT_IMAGE_URL = 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg'; // Set your default static image URL
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const  Video = require("../models/Video");
const Channel = require("../models/Channel");
const mongoose = require("mongoose");
// Configucre Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const sendEmailWithPDF = async (videoData, pdfPath, adminEmail) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: adminEmail, // ✅ dynamic email passed as argument
    subject: `New Video Submission: ${videoData.name}`,
    text: `Hello Admin,

A new video has been submitted for review.

📌 Title: ${videoData.name}
🎬 Vendor: ${videoData.vendor_id?.name}
🎭 Category: ${videoData.category_id?.name}
🗣 Language: ${videoData.language_id?.name}

Please find the attached PDF containing full details of the submission.

Regards,
Your Platform Team`,
    attachments: [
      {
        filename: 'video-details.pdf',
        path: pdfPath
      }
    ]
  });
};
const transporter = nodemailer.createTransport({ 
  service: 'gmail', // Use your email provider
  auth: {
    user: process.env.EMAIL_USER, // Admin email (set in environment variables)
    pass: process.env.EMAIL_PASS // Admin email password (use env variables for security)
  }
});
// Complete generatePDF function with all definitions
const generatePDF = async (videoData, outputPath) => {
  const doc = new PDFDocument({
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    }
  });
  const stream = fs.createWriteStream(outputPath);

  return new Promise((resolve, reject) => {
    doc.pipe(stream);

    // Define all terms and definitions
    const definitions = [
      {
        term: "Platform",
        def: "Refers to Gutargoo+, the digital streaming service owned and operated by Mega Frame Entertainment Pvt. Ltd."
      },
      {
        term: "Vendor",
        def: "Any individual, group, company, firm, or partnership who submits audiovisual content for distribution on the Platform."
      },
      {
        term: "Content",
        def: "All audiovisual materials including but not limited to movies, series, documentaries, music videos, and other entertainment content submitted by the Vendor."
      },
      {
        term: "Exclusive Content",
        def: "Content that is distributed solely through the Gutargoo+ Platform and not available on any other digital platform."
      },
      {
        term: "Non-Exclusive Content",
        def: "Content that may be distributed on multiple platforms including Gutargoo+ and other digital streaming services."
      },
      {
        term: "Revenue Share",
        def: "The percentage of net revenue that the Vendor receives from the monetization of their content on the Platform."
      },
      {
        term: "Net Revenue",
        def: "Gross revenue generated from content minus applicable taxes, payment processing fees, and platform operational costs."
      },
      {
        term: "Gutargoo+ View",
        def: "The Platform's proprietary monetization system that rewards content based on viewership metrics and engagement."
      },
      {
        term: "Rental View",
        def: "A pay-per-view model where users pay a specific amount to access content for a limited duration."
      },
      {
        term: "Advertisement Revenue",
        def: "Income generated from displaying advertisements before, during, or after content playback."
      }
    ];

    // Helper functions
    const addHeader = () => {
      doc.fontSize(10).text('Mega Frame Entertainment Pvt. Ltd.', { align: 'center' });
      doc.fontSize(8).text('Plot No - J1/32B, Street - 38, Chanakya place - 1, Uttam Nagar, New Delhi West - 110059', { align: 'center' });
      doc.moveDown(2);
    };

    const addSection = (title) => {
      doc.fontSize(12).text(title, { underline: true });
      doc.moveDown(1);
    };

    // Cover Page
    addHeader();
    doc.fontSize(16).text('VENDOR AGREEMENT', { align: 'center' });
    doc.moveDown(2);

    // Agreement Preamble
    doc.fontSize(10).text(`This Agreement ("Agreement") is entered into by and between Mega Frame Entertainment Private Limited, a company registered under the Companies Act, 2013, having its registered office at Plot No - J1/32B, Street - 38, Chanakya place - 1, Uttam Nagar, New Delhi West - 110059, hereinafter referred to as "Gutargoo+" or the "Platform," and ${videoData.vendor_id?.name || '[Vendor Name]'} ("Vendor"), which includes any individual, group, company, firm, or partnership who submits content for digital streaming and monetization through the Gutargoo+ OTT Platform.`, { align: 'justify' });
    doc.moveDown(1);

    // Purpose statement
    doc.text('The purpose of this Agreement is to establish the full terms, rights, responsibilities, and liabilities pertaining to the submission, hosting, monetization, and ongoing management of audiovisual content by the Vendor on the Gutargoo+ Platform.', { align: 'justify' });
    doc.moveDown(2);

    // Table of Contents
    addSection('TABLE OF CONTENTS');
    const sections = [
      'Section 1: Definitions and Interpretation',
      'Section 2: Appointment and Scope of Agreement',
      'Section 3: Rights Granted by Vendor',
      'Section 4: Content Submission Procedure',
      'Section 5: Document and Certificate Compliance',
      'Section 6: Exclusivity vs. Non-Exclusivity Models',
      'Section 7: Verification, Review, and Approval',
      'Section 8: Gutargoo+ View Monetization Models',
      'Section 9: Advertisement Policy',
      'Section 10: Rental View Policy',
      'Section 11: Per-View Earnings Policy',
      'Section 12: Payment Terms',
      'Section 13: Content Submission and Approval',
      'Section 14: Content Guidelines',
      'Section 15: Vendor Obligations',
      'Section 16: Termination and Suspension',
      'Section 17: Governing Law and Dispute Resolution',
      'Section 18: Miscellaneous',
      'Section 19: Signature and Execution',
      'Section 20: Final Provisions'
    ];

    sections.forEach((section, index) => {
      doc.text(`${index + 1}. ${section}`);
    });
    doc.addPage();

    // Section 1: Definitions and Interpretation
    addHeader();
    addSection('Section 1: Definitions and Interpretation');
    doc.text('1.1 Definitions', { underline: true });
    doc.moveDown(1);
    
    // Add definitions
    definitions.forEach(def => {
      doc.font('Helvetica-Bold')
         .text(`${def.term}:`, { continued: true });
      
      doc.font('Helvetica')
         .text(` ${def.def}`, { align: 'justify' });
      
      doc.moveDown(1);
    });

    // Section 2: Appointment and Scope
    doc.addPage();
    addHeader();
    addSection('Section 2: Appointment and Scope of Agreement');
    doc.text('2.1 The Vendor hereby appoints Gutargoo+ as the exclusive/non-exclusive digital distribution platform for the submitted content, subject to the terms and conditions set forth in this Agreement.');
    doc.moveDown(1);
    doc.text('2.2 This Agreement covers all aspects of content submission, review, approval, hosting, monetization, and revenue sharing between the parties.');
    doc.moveDown(2);

    // Section 3: Rights Granted
    addSection('Section 3: Rights Granted by Vendor');
    doc.text('3.1 The Vendor grants Gutargoo+ the right to host, stream, distribute, and monetize the submitted content through the Platform.');
    doc.moveDown(1);
    doc.text('3.2 The Vendor warrants that they own all necessary rights, licenses, and permissions for the content being submitted.');
    doc.moveDown(2);

    // Section 4: Content Submission
    addSection('Section 4: Content Submission Procedure');
    doc.text('4.1 All content must be submitted through the official Gutargoo+ vendor portal with complete metadata and required documentation.');
    doc.moveDown(1);
    doc.text('4.2 Content must meet technical specifications including resolution, format, and quality standards as defined by the Platform.');
    doc.moveDown(2);

    // Video Submission Details
    doc.addPage();
    addHeader();
    addSection('VIDEO SUBMISSION DETAILS');

    const details = [
      { label: 'Content Title', value: videoData.name },
      { label: 'Content Type', value: videoData.video_type },
      { label: 'Category', value: videoData.category_id?.name || 'Not specified' },
      { label: 'Language', value: videoData.language_id?.name || 'Not specified' },
      { label: 'Duration', value: videoData.video_duration ? `${videoData.video_duration} minutes` : 'Not specified' },
      { label: 'Release Date', value: videoData.release_date ? new Date(videoData.release_date).toLocaleDateString() : 'Not specified' },
      { label: 'Producer', value: videoData.producer_id?.name || 'Not specified' },
      { label: 'Channel', value: videoData.channel_id?.name || 'Not specified' },
      { label: 'Is Premium', value: videoData.is_premium ? 'Yes' : 'No' },
      { label: 'Is Rental', value: videoData.is_rent ? 'Yes' : 'No' },
      { label: 'Price', value: videoData.price ? `₹${videoData.price}` : 'Free' },
      { label: 'Rental Duration', value: videoData.rent_day ? `${videoData.rent_day} days` : 'N/A' }
    ];

    details.forEach(detail => {
      doc.text(`${detail.label}: ${detail.value}`, { continued: false });
    });

    // Cast Information
    if (videoData.cast_ids && videoData.cast_ids.length > 0) {
      doc.moveDown(1);
      doc.text('Cast Members:', { underline: true });
      videoData.cast_ids.forEach(cast => {
        doc.text(`• ${cast.name || cast}`);
      });
    }

    // Revenue Sharing Terms
    doc.addPage();
    addHeader();
    addSection('REVENUE SHARING TERMS');
    doc.text('5.1 Revenue Share: The Vendor shall receive 70% of the net revenue generated from their content, while Gutargoo+ retains 30% for platform operations and maintenance.');
    doc.moveDown(1);
    doc.text('5.2 Payment Schedule: Payments shall be made monthly, within 30 days of the end of each calendar month.');
    doc.moveDown(1);
    doc.text('5.3 Minimum Payout: A minimum threshold of ₹1000 must be reached before payment is processed.');
    doc.moveDown(2);

    // Terms and Conditions
    addSection('TERMS AND CONDITIONS');
    doc.text('6.1 The Vendor agrees to comply with all content guidelines and policies of the Gutargoo+ Platform.');
    doc.moveDown(1);
    doc.text('6.2 Gutargoo+ reserves the right to remove content that violates platform policies or applicable laws.');
    doc.moveDown(1);
    doc.text('6.3 This Agreement shall remain in effect until terminated by either party with 30 days written notice.');
    doc.moveDown(2);

    // Signature Section
    doc.addPage();
    addHeader();
    doc.moveDown(4);
    doc.text('IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.');
    doc.moveDown(2);

    // Vendor Signature
    doc.text('For the Vendor:', { underline: true });
    doc.moveDown(2);
    doc.text('Signature: _______________________');
    doc.text(`Name: ${videoData.vendor_id?.name || '[Vendor Name]'}`);
    doc.text('Date: ' + new Date().toLocaleDateString());
    doc.moveDown(2);

    // Platform Signature
    doc.text('For Gutargoo+:', { underline: true });
    doc.moveDown(2);
    doc.text('Signature: _______________________');
    doc.text('Name: _________________________');
    doc.text('Designation: ____________________');
    doc.text('Date: ' + new Date().toLocaleDateString());

    // Finalize PDF
    doc.end();

    stream.on('finish', () => {
      resolve();
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
};
// const generatePDF = async (videoData, outputPath) => {
//   const doc = new PDFDocument({
//     margins: {
//       top: 50,
//       bottom: 50,
//       left: 50,
//       right: 50
//     }
//   });
//   const stream = fs.createWriteStream(outputPath);

//   return new Promise((resolve, reject) => {
//     doc.pipe(stream);

//     // Helper functions
//     const addHeader = () => {
//       doc.fontSize(10).text('Mega Frame Entertainment Pvt. Ltd.', { align: 'center' });
//       doc.fontSize(8).text('Plot No - J1/32B, Street - 38, Chanakya place - 1, Uttam Nagar, New Delhi West - 110059', { align: 'center' });
//       doc.moveDown(2);
//     };

//     const addSection = (title) => {
//       doc.fontSize(12).text(title, { underline: true });
//       doc.moveDown(1);
//     };

//     // Cover Page
//     addHeader();
//     doc.fontSize(16).text('VENDOR AGREEMENT', { align: 'center' });
//     doc.moveDown(2);

//     // Agreement Preamble
//     doc.fontSize(10).text(`This Agreement ("Agreement") is entered into by and between Mega Frame Entertainment Private Limited, a company registered under the Companies Act, 2013, having its registered office at Plot No - J1/32B, Street - 38, Chanakya place - 1, Uttam Nagar, New Delhi West - 110059, hereinafter referred to as "Gutargoo+" or the "Platform," and ${videoData.vendor_id?.name || '[Vendor Name]'} ("Vendor"), which includes any individual, group, company, firm, or partnership who submits content for digital streaming and monetization through the Gutargoo+ OTT Platform.`, { align: 'justify' });
//     doc.moveDown(1);

//     // Purpose statement
//     doc.text('The purpose of this Agreement is to establish the full terms, rights, responsibilities, and liabilities pertaining to the submission, hosting, monetization, and ongoing management of audiovisual content by the Vendor on the Gutargoo+ Platform.', { align: 'justify' });
//     doc.moveDown(2);

//     // Table of Contents
//     addSection('TABLE OF CONTENTS');
//     const sections = [
//       'Section 1: Definitions and Interpretation',
//       'Section 2: Appointment and Scope of Agreement',
//       'Section 3: Rights Granted by Vendor',
//       'Section 4: Content Submission Procedure',
//       'Section 5: Document and Certificate Compliance',
//       'Section 6: Exclusivity vs. Non-Exclusivity Models',
//       'Section 7: Verification, Review, and Approval',
//       'Section 8: Gutargoo+ View Monetization Models',
//       'Section 9: Advertisement Policy',
//       'Section 10: Rental View Policy',
//       'Section 11: Per-View Earnings Policy',
//       'Section 12: Payment Terms',
//       'Section 13: Content Submission and Approval',
//       'Section 14: Content Guidelines',
//       'Section 15: Vendor Obligations',
//       'Section 16: Termination and Suspension',
//       'Section 17: Governing Law and Dispute Resolution',
//       'Section 18: Miscellaneous',
//       'Section 19: Signature and Execution',
//       'Section 20: Final Provisions'
//     ];

//     sections.forEach((section, index) => {
//       doc.text(`${index + 1}. ${section}`);
//     });
//     doc.addPage();

//     // Add all sections from the agreement
//     // Section 1: Definitions and Interpretation
//     addHeader();
//     addSection('Section 1: Definitions and Interpretation');
//     doc.text('1.1 Definitions', { underline: true });
//     doc.moveDown(1);
    
//     // Add definitions
    

//     definitions.forEach(def => {
//       doc.font('Helvetica-Bold')         // Set font to bold for the term
//          .text(`${def.term}:`, { continued: true });
      
//       doc.font('Helvetica')              // Set font back to normal for the definition
//          .text(` ${def.def}`, { align: 'justify' });
      
//       doc.moveDown(1);                   // Add spacing after each definition
//     });
    

//     // Continue adding all sections...
//     // [Additional sections would be added here following the same pattern]

//     // Video Submission Details
//     doc.addPage();
//     addHeader();
//     addSection('VIDEO SUBMISSION DETAILS');

//     const details = [
//       { label: 'Content Title', value: videoData.name },
//       { label: 'Content Type', value: videoData.video_type },
//       { label: 'Category', value: videoData.category_id?.name },
//       { label: 'Language', value: videoData.language_id?.name },
//       { label: 'Duration', value: `${videoData.video_duration} minutes` },
//       { label: 'Release Date', value: new Date(videoData.release_date).toLocaleDateString() },
//       { label: 'Producer', value: videoData.producer_id?.name },
//       { label: 'Channel', value: videoData.channel_id?.name }
//     ];

//     details.forEach(detail => {
//       doc.text(`${detail.label}: ${detail.value || 'Not specified'}`, { continued: false });
//     });

//     // Signature Section
//     doc.addPage();
//     addHeader();
//     doc.moveDown(4);
//     doc.text('IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.');
//     doc.moveDown(2);

//     // Vendor Signature
//     doc.text('For the Vendor:', { underline: true });
//     doc.moveDown(2);
//     doc.text('Signature: _______________________');
//     doc.text(`Name: ${videoData.vendor_id?.name || '[Vendor Name]'}`);
//     doc.text('Date: ' + new Date().toLocaleDateString());
//     doc.moveDown(2);

//     // Platform Signature
//     doc.text('For Gutargoo+:', { underline: true });
//     doc.moveDown(2);
//     doc.text('Signature: _______________________');
//     doc.text('Name: _________________________');
//     doc.text('Designation: ____________________');
//     doc.text('Date: ' + new Date().toLocaleDateString());

//     // Finalize PDF
//     doc.end();

//     stream.on('finish', () => {
//       resolve();
//     });

//     stream.on('error', (error) => {
//       reject(error);
//     });
//   });
// };


// const generatePDF = (videoData, filePath) => {
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument();
//     const stream = fs.createWriteStream(filePath);
//     doc.pipe(stream);

//     doc.fontSize(18).text('Video Submission Agreement', { underline: true });
//     doc.moveDown();
//     doc.fontSize(12).text(`Name: ${videoData.name}`);
//     doc.text(`Description: ${videoData.description}`);
//     doc.text(`Video Type: ${videoData.video_type}`);
//     doc.text(`Duration: ${videoData.video_duration}`);
//     doc.text(`Release Date: ${videoData.release_date}`);
//     doc.text(`Language: ${videoData.language_id?.name || 'N/A'}`);
//     doc.text(`Category: ${videoData.category_id?.name || 'N/A'}`);
//     doc.text(`Producer: ${videoData.producer_id?.name || 'N/A'}`);
//     doc.text(`Vendor: ${videoData.vendor_id?.name || 'N/A'}`);
//     doc.text(`Status: ${videoData.status}`);
//     doc.moveDown().text('Agreement Terms...');
//     doc.text('By uploading this video, the vendor agrees to platform terms and conditions.');

//     doc.end();
//     stream.on('finish', () => resolve());
//     stream.on('error', err => reject(err));
//   });
// };
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
router.get('/get-profile', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor._id;

    const vendor = await Vendor.findById(vendorId).select('-password'); // exclude password

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    res.status(200).json({
      success: true,
      vendor
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});
//upload video  (its simple uploading without doing the rentals videos and all )
// router.post(
//   '/create-video',isVendor,
//   upload.fields([
//     { name: 'thumbnail', maxCount: 1 },
//     { name: 'landscape', maxCount: 1 },
//     { name: 'video_320', maxCount: 1 },
//     { name: 'video_480', maxCount: 1 },
//     { name: 'video_720', maxCount: 1 },
//     { name: 'video_1080', maxCount: 1 },
//     { name: 'trailer', maxCount: 1 }
//   ]),
//   async (req, res) => {
//     try {
      
//       const { 
//         type_id, video_type,channel_id, producer_id, category_id,finalPackage_id,
//         language_id, cast_id, name, description, video_upload_type, video_extension,
//         video_duration, trailer_type, subtitle_type, subtitle_lang_1, subtitle_1,
//         subtitle_lang_2, subtitle_2, subtitle_lang_3, subtitle_3, release_date, is_premium,
//         is_title, is_download, is_like, is_comment, total_like, total_view, is_rent,
       
//       } = req.body;
//       const vendorId = req.vendor.id;
//       let typeIdToUse = type_id;

// if (!type_id) {
//   const defaultType = await Type.findOne({ name: 'movie' });
//   if (!defaultType) {
//     return res.status(400).json({ success: false, message: 'Default type "Movie" not found in database.' });
//   }
//   typeIdToUse = defaultType._id;
// }
//       // console.log("", vendorId);
//       // console.log(req.body)
//       let thumbnailUrl = '', landscapeUrl = '', video_320Url = '', video_480Url = '', video_720Url = '', video_1080Url = '', trailerUrl = '';

//       const uploadFile = async (field, folder) => {
//         if (req.files[field]) {
//           const file = req.files[field][0];
//           const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
//           return await uploadToCloudinary(base64, folder, file.mimetype);
//         }
//         return '';
//       };

//       thumbnailUrl = await uploadFile('thumbnail', 'videos/thumbnails');
//       landscapeUrl = await uploadFile('landscape', 'videos/landscapes');
//       video_320Url = await uploadFile('video_320', 'videos/320');
//       video_480Url = await uploadFile('video_480', 'videos/480');
//       video_720Url = await uploadFile('video_720', 'videos/720');
//       video_1080Url = await uploadFile('video_1080', 'videos/1080');
//       trailerUrl = await uploadFile('trailer', 'videos/trailers');

//       const newVideo = new Video({
//         // type_id: type_id ? new mongoose.Types.ObjectId(type_id) : null,
//         video_type,
//         vendor_id: new mongoose.Types.ObjectId(vendorId),
//         channel_id: channel_id ? new mongoose.Types.ObjectId(channel_id) : null,
//         producer_id: producer_id ? new mongoose.Types.ObjectId(producer_id) : null,
//         category_id: category_id ? new mongoose.Types.ObjectId(category_id) : null,
//         language_id: language_id ? new mongoose.Types.ObjectId(language_id) : null,
//         finalPackage_id: finalPackage_id ? new mongoose.Types.ObjectId(finalPackage_id) : null,
//         cast_id: cast_id ? new mongoose.Types.ObjectId(cast_id) : null,
//         name,
//         // monetizationType,
//         comments: [],
//         thumbnail: thumbnailUrl,
//         landscape: landscapeUrl,
//         description,
//         video_upload_type,
//         video_320: video_320Url,
//         video_480: video_480Url,
//         video_720: video_720Url,
//         video_1080: video_1080Url,
//         video_extension,
//         video_duration: Number(video_duration),
//         trailer_type,
//         trailer_url: trailerUrl,
//         subtitle_type,
//         subtitle_lang_1,
//         subtitle_1,
//         subtitle_lang_2,
//         subtitle_2,
//         subtitle_lang_3,
//         subtitle_3,
//         release_date,
//         is_premium: Number(is_premium),
//         is_title: Number(is_title),
//         is_download: Number(is_download),
//         is_like: Number(is_like),
//         is_comment: Number(is_comment),
//         total_like: Number(total_like),
//         total_view: Number(total_view),
//         is_rent: Number(is_rent),
//         // price: Number(price),
//         // rent_day: Number(rent_day),
//         status:"pending",
//         isApproved: false
//         // packageType: package.revenueType,
//         // packageDetails: {
//         //   price: req.body.price || package.price,
//         //   viewThreshold: package.viewThreshold,
//         //   commissionRate: package.commissionRate
//         // }
//       });
//       await newVideo.save();
  
//       const populatedVideo = await Video.findById(newVideo._id)
//         // .populate('type_id', 'name')
//         .populate('category_id', 'name')
//         .populate('cast_id', 'name')
//         .populate('language_id', 'name')
//         .populate('producer_id', 'name')
//         .populate('channel_id', 'name')
//         .populate('vendor_id', 'name')
//         .populate({
//           path: 'comments',
//           populate: {
//             path: 'user_id',
//             select: 'name'
//           }
//         })
//         .populate('finalPackage_id',name);
//          // ✅ Fetch admin email from DB
//       const admin = await Admin.findOne({ role: 'admin' }); // adjust if role is stored differently
//       if (!admin || !admin.email) {
//         throw new Error('Admin email not found.');
//       }

//       // ✅ Generate PDF and email it to admin
//       const pdfPath = path.join(__dirname, `../temp/video-${newVideo._id}.pdf`);
//       await generatePDF(populatedVideo, pdfPath);
//       await sendEmailWithPDF(populatedVideo, pdfPath, admin.email);

//       // ✅ Delete PDF after sending
//       fs.unlink(pdfPath, err => {
//         if (err) console.error('Failed to delete PDF:', err);
//       });
//       res.status(201).json({
//         success: true,
//         message: 'Video created successfully',
//         video: populatedVideo
//       });

//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ success: false, message: 'Video creation failed', error: err.message });
//     }
//   }
// );
// router.post('/create-video', isVendor, upload.fields([
//   { name: 'thumbnail', maxCount: 1 },
//   { name: 'landscape', maxCount: 1 },
//   { name: 'video_320', maxCount: 1 },
//   { name: 'video_480', maxCount: 1 },
//   { name: 'video_720', maxCount: 1 },
//   { name: 'video_1080', maxCount: 1 },
//   { name: 'trailer', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const { 
//       type_id, video_type, channel_id, producer_id, category_id, finalPackage_id,
//       language_id, cast_ids, name, description, video_upload_type, video_extension,
//       video_duration, trailer_type, subtitle_type, subtitle_lang_1, subtitle_1,
//       subtitle_lang_2, subtitle_2, subtitle_lang_3, subtitle_3, release_date, is_premium,
//       is_title, is_download, is_like, is_comment, total_like, total_view, is_rent
//     } = req.body;

//     let castIdsArray = [];
//     if (cast_ids) {
//       // If cast_ids is a string, parse it (in case it's sent as JSON string)
//       if (typeof cast_ids === 'string') {
//         try {
//           castIdsArray = JSON.parse(cast_ids);
//         } catch (e) {
//           castIdsArray = cast_ids.split(',').map(id => id.trim()); // Alternative: split by comma if sent as comma-separated string
//         }
//       } else if (Array.isArray(cast_ids)) {
//         castIdsArray = cast_ids;
//       }

//       // Convert all cast IDs to ObjectId
//       castIdsArray = castIdsArray.map(id => new mongoose.Types.ObjectId(id));
//     }
//     const vendorId = req.vendor.id;

//     // Initialize rental-related variables
//     let videoPrice = 0;
//     let rentDuration = null;
//     let selectedPackage = null;

//     // Handle rental video logic
//     if (Number(is_rent) === 1) {
//       // Validate package selection for rental videos
//       if (!finalPackage_id) {
//         return res.status(400).json({
//           success: false,
//           message: 'Final package selection is required for rental videos'
//         });
//       }

//       // Fetch package details
//       selectedPackage = await finalPackage.findById(finalPackage_id);
//       if (!selectedPackage) {
//         return res.status(400).json({
//           success: false,
//           message: 'Selected package not found'
//         });
//       }

//       // Set price and duration from package
//       videoPrice = selectedPackage.price;
//       rentDuration = selectedPackage.rentalDuration;
//     }

//     // Handle type_id
//     let typeIdToUse = type_id;
//     if (!type_id) {
//       const defaultType = await Type.findOne({ name: 'movie' });
//       if (!defaultType) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'Default type "Movie" not found in database.' 
//         });
//       }
//       typeIdToUse = defaultType._id;
//     }

//     // File upload logic
//     let thumbnailUrl = '', landscapeUrl = '', video_320Url = '', 
//         video_480Url = '', video_720Url = '', video_1080Url = '', trailerUrl = '';

//     // const uploadFile = async (field, folder) => {
//     //   if (req.files[field]) {
//     //     const file = req.files[field][0];
//     //     const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
//     //     return await uploadToCloudinary(base64, folder, file.mimetype);
//     //   }
//     //   return '';
//     // };
//     const uploadFile = async (field, folder) => {
//       if (req.files && req.files[field] && req.files[field][0]) {
//         const file = req.files[field][0];
    
//         let buffer = file.buffer;
//         let mimetype = file.mimetype;
    
//         if (mimetype === 'image/heic' || mimetype === 'image/heif') {
//           const outputBuffer = await heicConvert({
//             buffer: buffer, // the HEIC file buffer
//             format: 'JPEG',
//             quality: 1
//           });
//           buffer = outputBuffer;
//           mimetype = 'image/jpeg';
//         }
    
//         const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
//         return await uploadToCloudinary(base64, folder, mimetype);
//       }
//       return '';
//     };
//     try {
//       // Upload thumbnail
//       thumbnailUrl = await uploadFile('thumbnail', 'series/thumbnails');
//       // Upload landscape
//       landscapeUrl = await uploadFile('landscape', 'series/landscapes');
//     } catch (uploadError) {
//       console.error('File upload error:', uploadError);
//       return res.status(400).json({ 
//         success: false, 
//         error: 'File upload failed',
//         details: uploadError.message 
//       });
//     }
//     // Upload all files
//     thumbnailUrl = await uploadFile('thumbnail', 'videos/thumbnails');
//     landscapeUrl = await uploadFile('landscape', 'videos/landscapes');
//     video_320Url = await uploadFile('video_320', 'videos/320');
//     video_480Url = await uploadFile('video_480', 'videos/480');
//     video_720Url = await uploadFile('video_720', 'videos/720');
//     video_1080Url = await uploadFile('video_1080', 'videos/1080');
//     trailerUrl = await uploadFile('trailer', 'videos/trailers');

//     // Create new video object
//     const newVideo = new Video({
//       video_type,
//       vendor_id: new mongoose.Types.ObjectId(vendorId),
//       channel_id: channel_id ? new mongoose.Types.ObjectId(channel_id) : null,
//       producer_id: producer_id ? new mongoose.Types.ObjectId(producer_id) : null,
//       category_id: category_id ? new mongoose.Types.ObjectId(category_id) : null,
//       language_id: language_id ? new mongoose.Types.ObjectId(language_id) : null,
//       // cast_id: cast_id ? new mongoose.Types.ObjectId(cast_id) : null,
//       cast_ids: castIdsArray, // Use the array of cast IDs

//       // Rental-specific fields
//       is_rent: Number(is_rent),
//       price: videoPrice,
//       rent_day: rentDuration,
//       finalPackage_id: Number(is_rent) === 1 ? new mongoose.Types.ObjectId(finalPackage_id) : null,
      
//       // Basic fields
//       name,
//       description,
//       comments: [],
      
//       // Media URLs
//       thumbnail: thumbnailUrl,
//       landscape: landscapeUrl,
//       video_320: video_320Url,
//       video_480: video_480Url,
//       video_720: video_720Url,
//       video_1080: video_1080Url,
//       video_extension,
//       video_duration: Number(video_duration),
//       trailer_type,
//       trailer_url: trailerUrl,
      
//       // Subtitle information
//       subtitle_type,
//       subtitle_lang_1,
//       subtitle_1,
//       subtitle_lang_2,
//       subtitle_2,
//       subtitle_lang_3,
//       subtitle_3,
      
//       // Additional settings
//       release_date,
//       is_premium: Number(is_premium),
//       is_title: Number(is_title),
//       is_download: Number(is_download),
//       is_like: Number(is_like),
//       is_comment: Number(is_comment),
//       total_like: Number(total_like),
//       total_view: Number(total_view),
      
//       // Status
//       status: "pending",
//       isApproved: false
//     });

//     await newVideo.save();

//     // Populate video details
//     const populatedVideo = await Video.findById(newVideo._id)
//       .populate('category_id', 'name')
//       .populate('cast_ids', 'name') // Changed from cast_id to cast_ids
//       .populate('language_id', 'name')
//       .populate('producer_id', 'name')
//       .populate('channel_id', 'name')
//       .populate('vendor_id', 'name')
//       .populate('finalPackage_id')
//       .populate({
//         path: 'comments',
//         populate: {
//           path: 'user_id',
//           select: 'name'
//         }
//       });

//     // Handle admin notification
//     const admin = await Admin.findOne({ role: 'admin' });
//     if (!admin || !admin.email) {
//       throw new Error('Admin email not found.');
//     }
//     const handleCastSelection = (e) => {
//       // Get selected options from the multiple select
//       const selectedOptions = Array.from(e.target.selectedOptions);
//       const selectedCastIds = selectedOptions.map(option => option.value);
      
//       setFormData(prev => ({
//         ...prev,
//         cast_ids: selectedCastIds
//       }));
//     };
    
//     // Generate and send PDF
//     const pdfPath = path.join(__dirname, `../temp/video-${newVideo._id}.pdf`);
//     await generatePDF(populatedVideo, pdfPath);
//     await sendEmailWithPDF(populatedVideo, pdfPath, admin.email);

//     // Cleanup PDF
//     fs.unlink(pdfPath, err => {
//       if (err) console.error('Failed to delete PDF:', err);
//     });

//     // Send response
//     res.status(201).json({
//       success: true,
//       message: 'Video created successfully',
//       video: populatedVideo
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Video creation failed', 
//       error: err.message 
//     });
//   }
// });
router.post('/create-video', isVendor, upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'landscape', maxCount: 1 },
  { name: 'video_320', maxCount: 1 },
  { name: 'video_480', maxCount: 1 },
  { name: 'video_720', maxCount: 1 },
  { name: 'video_1080', maxCount: 1 },
  { name: 'trailer', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      type_id, video_type, channel_id, producer_id, category_id, finalPackage_id,
      language_id, cast_ids, name, description, video_upload_type, video_extension,
      video_duration, trailer_type, subtitle_type, subtitle_lang_1, subtitle_1,
      subtitle_lang_2, subtitle_2, subtitle_lang_3, subtitle_3, release_date, is_premium,
      is_title, is_download, is_like, is_comment, total_like, total_view, is_rent
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Video name is required'
      });
    }

    let castIdsArray = [];
    if (cast_ids) {
      try {
        if (typeof cast_ids === 'string') {
          castIdsArray = JSON.parse(cast_ids);
        } else if (Array.isArray(cast_ids)) {
          castIdsArray = cast_ids;
        }
        castIdsArray = castIdsArray.map(id => new mongoose.Types.ObjectId(id));
      } catch (error) {
        console.error('Error parsing cast_ids:', error);
        castIdsArray = [];
      }
    }

    const vendorId = req.vendor.id;

    // Initialize rental-related variables
    let videoPrice = 0;
    let rentDuration = null;
    let selectedPackage = null;

    // Handle rental video logic
    if (Number(is_rent) === 1) {
      if (!finalPackage_id) {
        return res.status(400).json({
          success: false,
          message: 'Final package selection is required for rental videos'
        });
      }

      try {
        selectedPackage = await finalPackage.findById(finalPackage_id);
        if (!selectedPackage) {
          return res.status(400).json({
            success: false,
            message: 'Selected package not found'
          });
        }
        videoPrice = selectedPackage.price;
        rentDuration = selectedPackage.rentalDuration;
      } catch (error) {
        console.error('Error fetching package:', error);
        return res.status(500).json({
          success: false,
          message: 'Error processing rental package'
        });
      }
    }

    // Handle type_id
    let typeIdToUse = type_id;
    if (!type_id) {
      try {
        const defaultType = await Type.findOne({ name: 'movie' });
        if (!defaultType) {
          return res.status(400).json({ 
            success: false, 
            message: 'Default type "Movie" not found in database.' 
          });
        }
        typeIdToUse = defaultType._id;
      } catch (error) {
        console.error('Error fetching default type:', error);
        return res.status(500).json({
          success: false,
          message: 'Error processing video type'
        });
      }
    }

    // File upload function with error handling
    const uploadFile = async (field, folder) => {
      try {
        if (req.files && req.files[field] && req.files[field][0]) {
          const file = req.files[field][0];
          let buffer = file.buffer;
          let mimetype = file.mimetype;

          // Handle HEIC/HEIF conversion
          if (mimetype === 'image/heic' || mimetype === 'image/heif') {
            try {
              const outputBuffer = await heicConvert({
                buffer: buffer,
                format: 'JPEG',
                quality: 1
              });
              buffer = outputBuffer;
              mimetype = 'image/jpeg';
            } catch (heicError) {
              console.error('HEIC conversion error:', heicError);
              throw new Error('Failed to convert HEIC image');
            }
          }

          const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
          return await uploadToCloudinary(base64, folder, mimetype);
        }
        return '';
      } catch (error) {
        console.error(`Upload error for ${field}:`, error);
        throw error;
      }
    };

    // Upload all files with error handling
    let thumbnailUrl = '', landscapeUrl = '', video_320Url = '', 
        video_480Url = '', video_720Url = '', video_1080Url = '', trailerUrl = '';

    try {
      thumbnailUrl = await uploadFile('thumbnail', 'videos/thumbnails');
      landscapeUrl = await uploadFile('landscape', 'videos/landscapes');
      video_320Url = await uploadFile('video_320', 'videos/320');
      video_480Url = await uploadFile('video_480', 'videos/480');
      video_720Url = await uploadFile('video_720', 'videos/720');
      video_1080Url = await uploadFile('video_1080', 'videos/1080');
      trailerUrl = await uploadFile('trailer', 'videos/trailers');
    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      return res.status(400).json({ 
        success: false, 
        error: 'File upload failed',
        details: uploadError.message 
      });
    }

    // Create new video object
    const newVideo = new Video({
      video_type: video_type || 'movie',
      vendor_id: new mongoose.Types.ObjectId(vendorId),
      channel_id: channel_id ? new mongoose.Types.ObjectId(channel_id) : null,
      producer_id: producer_id ? new mongoose.Types.ObjectId(producer_id) : null,
      category_id: category_id ? new mongoose.Types.ObjectId(category_id) : null,
      language_id: language_id ? new mongoose.Types.ObjectId(language_id) : null,
      cast_ids: castIdsArray,

      // Rental-specific fields
      is_rent: Number(is_rent) || 0,
      price: videoPrice,
      rent_day: rentDuration,
      finalPackage_id: Number(is_rent) === 1 ? new mongoose.Types.ObjectId(finalPackage_id) : null,
      
      // Basic fields
      name,
      description: description || '',
      comments: [],
      
      // Media URLs
      thumbnail: thumbnailUrl,
      landscape: landscapeUrl,
      video_320: video_320Url,
      video_480: video_480Url,
      video_720: video_720Url,
      video_1080: video_1080Url,
      video_extension: video_extension || 'mp4',
      video_duration: Number(video_duration) || 0,
      trailer_type: trailer_type || '',
      trailer_url: trailerUrl,
      
      // Subtitle information
      subtitle_type: subtitle_type || '',
      subtitle_lang_1: subtitle_lang_1 || '',
      subtitle_1: subtitle_1 || '',
      subtitle_lang_2: subtitle_lang_2 || '',
      subtitle_2: subtitle_2 || '',
      subtitle_lang_3: subtitle_lang_3 || '',
      subtitle_3: subtitle_3 || '',
      
      // Additional settings
      release_date: release_date || new Date(),
      is_premium: Number(is_premium) || 0,
      is_title: Number(is_title) || 0,
      is_download: Number(is_download) || 0,
      is_like: Number(is_like) || 0,
      is_comment: Number(is_comment) || 0,
      total_like: Number(total_like) || 0,
      total_view: Number(total_view) || 0,
      
      // Status
      status: "pending",
      isApproved: false
    });

    // Save the video
    await newVideo.save();

    // Populate video details
    const populatedVideo = await Video.findById(newVideo._id)
      .populate('category_id', 'name')
      .populate('cast_ids', 'name')
      .populate('language_id', 'name')
      .populate('producer_id', 'name')
      .populate('channel_id', 'name')
      .populate('vendor_id', 'name')
      .populate('finalPackage_id')
      .populate({
        path: 'comments',
        populate: {
          path: 'user_id',
          select: 'name'
        }
      });

    // Handle admin notification and PDF generation
    try {
      const admin = await Admin.findOne({ role: 'admin' });
      if (admin && admin.email) {
        const pdfPath = path.join(__dirname, `../temp/video-${newVideo._id}.pdf`);
        
        // Ensure temp directory exists
        const tempDir = path.dirname(pdfPath);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        await generatePDF(populatedVideo, pdfPath);
        
        // Check if sendEmailWithPDF function exists
        if (typeof sendEmailWithPDF === 'function') {
          await sendEmailWithPDF(populatedVideo, pdfPath, admin.email);
        }

        // Cleanup PDF
        setTimeout(() => {
          fs.unlink(pdfPath, (err) => {
            if (err) console.error('Failed to delete PDF:', err);
          });
        }, 5000);
      }
    } catch (emailError) {
      console.error('Email/PDF generation error:', emailError);
      // Don't fail the video creation if email fails
    }

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      video: populatedVideo
    });

  } catch (err) {
    console.error('Video creation error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Video creation failed', 
      error: err.message 
    });
  }
});

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
// DELETE /vendor/delete-video/:id
router.delete('/delete-video/:id',isVendor, async (req, res) => {
  try {
    const videoId = req.params.id;
    const vendorId = req.vendor.id;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ success: false, message: 'Invalid video ID' });
    }

    // Find the video
    const video = await Video.findOne({ _id: videoId, vendor_id: vendorId });

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found or unauthorized' });
    }

   

    // Delete from DB
    await Video.deleteOne({ _id: videoId });

    res.status(200).json({ success: true, message: 'Video deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});
//get all the  videos 
router.get('/videos', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor?._id
   

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
// Route: GET /api/vendors/videos
router.get('/filter-videos', async (req, res) => {
  try {
    const { type } = req.query;

    const filter = {};
    if (type) {
      filter.video_type = type;
    }

    const videos = await Video.find(filter)
      .populate('finalPackage_id')
      .populate('category_id');

    res.status(200).json({ videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'Internal server error' });
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
// // Route: Calculate vendor and admin earnings based on likes
// router.get('/calculate-earnings', isVendor,async (req, res) => {
//   const vendorId = req.vendor.id; // Extracted vendorId from the token

//   try {
//     // Fetch global settings from the database
//     const setting = await Setting.findOne();
//     if (!setting) {
//       return res.status(404).json({ message: 'Earnings settings not found. Please set earnings first.' });
//     }

//     // Find all videos uploaded by this vendor
//     const videos = await Video.find({ vendor_id: vendorId, isApproved: true });

//     // Calculate total likes across all videos
//     const totalLikes = videos.reduce((acc, video) => acc + (video.total_like || 0), 0);

//     // Calculate total earnings based on likes
//     const totalEarnings = totalLikes * setting.pricePerLike;

//     // Split earnings based on the settings
//     const vendorShare = (setting.vendorPercentage / 100) * totalEarnings;
//     const adminShare = (setting.adminPercentage / 100) * totalEarnings;

//     // Update vendor wallet
//     const vendor = await Vendor.findById(vendorId);
//     if (!vendor) {
//       return res.status(404).json({ message: 'Vendor not found' });
//     }
//     vendor.wallet += vendorShare;
//     await vendor.save();

//     // Update admin wallet (assuming single admin)
//     const admin = await Admin.findOne();
//     if (admin) {
//       admin.wallet += adminShare;
//       await admin.save();
//     }

//     res.status(200).json({
//       message: 'Earnings calculated successfully',
//       vendorWallet: vendor.wallet,
//       adminWallet: admin ? admin.wallet : 0,
//       totalLikes,
//       totalEarnings,
//       vendorShare,
//       adminShare
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error calculating earnings', error: error.message });
//   }
// });
// 🆕 Calculate and update vendor earnings based on views
router.get('/calculate-vendor-earnings', isVendor, async (req, res) => {
  const vendorId = req.vendor.id;

  try {
    // Get admin settings for price per view
    const admin = await Admin.findOne();
    if (!admin || !admin.pricePerView) {
      return res.status(404).json({ 
        success: false, 
        message: 'Price per view not set by admin. Please contact administrator.' 
      });
    }

    // Find vendor
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Get total views for this vendor (you might need to adjust this based on your Video schema)
    // const videos = await Video.find({ vendor_id: vendorId, isApproved: true });
    // const totalViews = videos.reduce((acc, video) => acc + (video.total_view || 0), 0);
    // const vendor = await Vendor.findById(vendorId).select('totalViews');
    const totalViews = vendor?.totalViews || 0;
    
    // Calculate earnings
    const pricePerView = admin.pricePerView;
    const grossEarnings = totalViews * pricePerView;
    const adminShare = (admin.adminPercentage / 100) * grossEarnings;
    const vendorShare = (admin.vendorPercentage / 100) * grossEarnings;
   console.log(vendorShare)
    // Update vendor earnings
    vendor.totalEarningsFromViews += vendorShare;
    vendor.wallet += vendorShare;
    vendor.lockedBalance = vendor.wallet;


    console.log(vendor.wallet+" this is wallet")
    
    // Add to earnings history
    vendor.viewsEarningsHistory.push({
      viewsCount: totalViews,
      pricePerView: pricePerView,
      grossEarnings: grossEarnings,
      vendorEarnings: vendorShare,
      adminEarnings: adminShare
    });

    await vendor.save();

    // Update admin earnings
    admin.wallet += adminShare;
    admin.totalEarningsFromViews += adminShare;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Earnings calculated and updated successfully',
      data: {
        totalViews,
        pricePerView,
        vendorEarnings: vendorShare.toFixed(2),
        vendorWallet: vendor.wallet.toFixed(2),
        lockedBalance: vendor.lockedBalance.toFixed(2), // 🆕 Include locked balance

        vendorTotalEarningsFromViews: vendor.totalEarningsFromViews.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error calculating vendor earnings:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Route to get vendor earnings this is the wrong api 
// router.get('/vendor/earnings',isVendor, async (req, res) => {
//   try {
//     const vendorId = req.vendor.id

//     // Fetch all APPROVED videos uploaded by this vendor
//     const videos = await Video.find({ vendor_id: vendorId, isApproved: true });

//     let totalEarnings = 0;
//     let detailedEarnings = [];

//     videos.forEach(video => {
//       let videoEarnings = 0;

//       if (video.monetizationType === 'rental' && video.price) {
//         // Earnings from rentals
//         videoEarnings = video.total_view * video.price;
//       } 
//       else if (video.monetizationType === 'view') {
//         // Earnings from views (let's assume $0.01 per view if not specified)
//         videoEarnings = video.viewCount * 0.01;
//       } 
//       else if (video.monetizationType === 'ad') {
//         // Earnings from ad views (let's assume $0.005 per ad view if not specified)
//         videoEarnings = video.adViews * 0.005;
//       }

//       totalEarnings += videoEarnings;
//       console.log("total earnings", totalEarnings);

//       detailedEarnings.push({
//         videoId: video._id,
//         name: video.name,
//         monetizationType: video.monetizationType,
//         earnings: videoEarnings.toFixed(2)
//       });
//     });

//     // Update the vendor's wallet (optional, if you want real-time update)
//     await Vendor.findByIdAndUpdate(vendorId, { wallet: totalEarnings });

//     res.status(200).json({
//       success: true,
//       vendorId,
//       totalEarnings: totalEarnings.toFixed(2),
//       videos: detailedEarnings
//     });
//   } catch (error) {
//     console.error('Error fetching vendor earnings:', error);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// 🔧 CORRECTED: Get vendor earnings details
router.get('/vendor/earnings', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id;

    // Get vendor details
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Get admin settings for price per view
    const admin = await Admin.findOne();
    const currentPricePerView = admin ? admin.pricePerView : 0;

    // Get all approved videos by this vendor
    const videos = await Video.find({ vendor_id: vendorId, isApproved: true });
    
    // Calculate current total views
    const result = await Vendor.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$totalViews" }
        }
      }
    ]);

    const totalViews = result[0]?.totalViews || 0;
    console.log("Total Views by all vendors:", totalViews);
    

    // Detailed video earnings (only vendor's share)
    const videoEarnings = videos.map(video => {
      const videoViews = video.total_view || 0;
      const grossVideoEarnings = videoViews * currentPricePerView;
      const vendorVideoEarnings = grossVideoEarnings * 0.4; // 40% for vendor

      return {
        videoId: video._id,
        name: video.name,
        views: videoViews,
        vendorEarnings: vendorVideoEarnings.toFixed(2)
      };
    });

    res.status(200).json({
      success: true,
      data: {
        vendorId,
        totalViews,
        lockedBalance: vendor.wallet.toFixed(2), // 🆕 All wallet balance is locked balance
        currentPricePerView,
        vendorWallet: vendor.wallet.toFixed(2),
        totalEarningsFromViews: vendor.totalEarningsFromViews.toFixed(2),
        earningsHistory: vendor.viewsEarningsHistory.map(history => ({
          date: history.date,
          viewsCount: history.viewsCount,
          pricePerView: history.pricePerView,
          vendorEarnings: history.vendorEarnings.toFixed(2)
        })),
        videoBreakdown: videoEarnings
      }
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
 // GET total number of TV shows
router.get('/tvshows/count', async (req, res) => {
  try {
    const tvShowType = 2; // Replace with your actual TV show type ID
    const totalTVShows = await Type.countDocuments({ type: tvShowType, status: 1 }); // only active

    res.status(200).json({
      success: true,
      totalTVShows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
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
// get videos by status
// router.get('/videos-by-status', isVendor, async (req, res) => {
//   try {
//     const vendorId = req.vendor.id;
//     const { status } = req.query; // 'pending', 'approved', or 'rejected'

//     // Initialize the query to search for the vendor's videos
//     const query = { vendor_id: vendorId };

//     // If a status is provided, add it to the query
//     if (status) {
//       query.status = status;
//     }

//     // Fetch the videos with the required fields
//     const videos = await Video.find(query).select(
//       'name thumbnail video_type status finalPackage_id' // Add 'finalPackage_id' to query
//     );

//     // For each video, retrieve the associated price from the final package
//     for (let video of videos) {
//       // Assuming you have a FinalPackage model to get the package details
//       const package = await finalPackage.findById(video.finalPackage_id);
//      console.log("package id "+package)
//       // If the package is found, add the price to the video
//       if (package) {
//         video.price = package.price;
//         console.log(video.price);
//       } else {
//         video.price = 0; // Default price if no package is found
//       }
//     }
      

//     // Return the response with the video data including the price
//     return res.status(200).json({
//       success: true,
//       videos,
//     });
//   } catch (error) {
//     console.error('Error fetching videos:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal Server Error',
//     });
//   }
// });
// get videos by status
router.get('/videos-by-status', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { status } = req.query; // 'pending', 'approved', or 'rejected'

    const query = { vendor_id: vendorId };
    if (status) query.status = status;

    // Fetch videos with populated category and selected fields
    let videos = await Video.find(query)
      .select('name thumbnail video_type status finalPackage_id category_id') // Include category_id
      .populate('category_id', 'name'); // Populate category name

    // Add price from final package
    for (let video of videos) {
      const pkg = await finalPackage.findById(video.finalPackage_id);
      video.price = pkg ? pkg.price : 0;
    }

    // Return videos with populated category
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

// get top performing
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
// GET vendor earnings using token without lock period
// router.get('/vendor-earnings', isVendor, async (req, res) => {
//   try {
//     const vendorId = req.vendor.id;
//     const vendor = await Vendor.findById(vendorId);
//     if (!vendor) {
//       return res.status(404).json({ success: false, message: 'Vendor not found' });
//     }
//     console.log("vendor.totalViews:", vendor.totalViews);
//     const admin = await Admin.findOne();
//     console.log("admin", admin);
//     if (!admin) {
//       return res.status(404).json({ success: false, message: 'Admin not found' });
//     }
//     const earnings = vendor.totalViews * admin.pricePerView;
//     console.log("earningis :", earnings);
//     res.json({
//       success: true,
//       vendorId: vendor._id,
//       totalViews: vendor.totalViews,
//       pricePerView: admin.pricePerView,
//       earnings
//     });
//   } catch (error) {
//     console.error('Error fetching vendor earnings:', error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });
router.get('/vendor-earnings', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // 🔒 Check if there's an active lock period
    const lockPeriod = await VendorLockPeriod.findOne({
      vendorId,
      isActive: true,
      endDate: { $gt: new Date() }
    });
    console.log("end date"+lockPeriod.endDate.toISOString());
    if (lockPeriod) {
      const remainingDays = lockPeriod.getRemainingDays ? lockPeriod.getRemainingDays() : 0;
     console.log("remain days ", remainingDays);
      return res.status(403).json({
        success: false,
        message: `Earnings are locked. You can access your earnings after ${remainingDays} day(s).`
      });
    }

    // ✅ Lock period is either not set or completed
    const earnings = vendor.totalViews * admin.pricePerView;

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
// Create a new series
router.post('/series', isVendor, upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'landscape', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, category_id, releaseYear, tags } = req.body;
    
    // Initialize urls as empty strings
    let thumbnailUrl = '';
    let landscapeUrl = '';

    // Helper function to handle file upload
    // const uploadFile = async (field, folder) => {
    //   if (req.files && req.files[field] && req.files[field][0]) {
    //     const file = req.files[field][0];
    //     const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    //     return await uploadToCloudinary(base64, folder, file.mimetype);
    //   }
    //   return '';
    // };
    const uploadFile = async (field, folder) => {
      if (req.files && req.files[field] && req.files[field][0]) {
        const file = req.files[field][0];
    
        let buffer = file.buffer;
        let mimetype = file.mimetype;
    
        if (mimetype === 'image/heic' || mimetype === 'image/heif') {
          const outputBuffer = await heicConvert({
            buffer: buffer, // the HEIC file buffer
            format: 'JPEG',
            quality: 1
          });
          buffer = outputBuffer;
          mimetype = 'image/jpeg';
        }
    
        const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
        return await uploadToCloudinary(base64, folder, mimetype);
      }
      return '';
    };
    try {
      // Upload thumbnail
      thumbnailUrl = await uploadFile('thumbnail', 'series/thumbnails');
      // Upload landscape
      landscapeUrl = await uploadFile('landscape', 'series/landscapes');
    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      return res.status(400).json({ 
        success: false, 
        error: 'File upload failed',
        details: uploadError.message 
      });
    }

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    // ✅ Fetch default type_id for "web-series"
    const webSeriesType = await Type.findOne({ name: 'web-series' });
    if (!webSeriesType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Default type "web-series" not found in Type collection' 
      });
    }
    // Create new series
    const series = new Series({
      title,
      description: description || '',
      vendor_id: req.vendor.id,
      category_id: category_id || null,
      type_id: webSeriesType._id, // ✅ Set default type_id here
      thumbnail: thumbnailUrl,
      landscape: landscapeUrl,
      releaseYear: releaseYear || new Date().getFullYear(),
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await series.save();

    // Return success response
    res.status(201).json({ 
      success: true, 
      message: 'Series created successfully',
      series 
    });

  } catch (error) {
    console.error('Series creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create series',
      details: error.message 
    });
  }
});
// // Get all series uploaded by the logged-in vendor
// router.get('/series', isVendor, async (req, res) => {
//   try {
//     const seriesList = await Series.find({ vendor_id: req.vendor.id }).select('_id title');
//     res.status(200).json({ success: true, series: seriesList });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });
// Get all seasons for a specific series
router.get('/seasons/:seriesId', isVendor, async (req, res) => {
  try {
    const { seriesId } = req.params;
    
    // Validate seriesId
    if (!seriesId) {
      return res.status(400).json({ success: false, error: 'Series ID is required' });
    }

    // Check if series exists and belongs to the vendor
    const series = await Series.findOne({ 
      _id: seriesId, 
      vendor_id: req.vendor.id 
    });

    if (!series) {
      return res.status(404).json({ success: false, error: 'Series not found or unauthorized' });
    }

    const seasons = await Season.find({ series_id: seriesId })
      .sort({ seasonNumber: 1 })
      .select('_id title seasonNumber releaseDate');

    res.status(200).json({ success: true, seasons });
  } catch (error) {
    console.error('Error fetching seasons:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error', 
      message: error.message 
    });
  }
});
// Get all series uploaded by the logged-in vendor
router.get('/series', isVendor, async (req, res) => {
  try {
    const seriesList = await Series.find({ vendor_id: req.vendor.id })
      .select('_id title')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      series: seriesList 
    });
  } catch (error) {
    console.error('Error fetching series:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch series', 
      message: error.message 
    });
  }
});
// Add a new season to a series
router.post('/series/:seriesId/seasons', isVendor, async (req, res) => {
  try {
    const { seasonNumber, title, description, releaseDate } = req.body;
    const series = await Series.findOne({ 
      _id: req.params.seriesId, 
      vendor_id: req.vendor.id 
    });

    if (!series) {
      return res.status(404).json({ success: false, message: 'Series not found' });
    }

    const season = new Season({
      series_id: series._id,
      seasonNumber,
      title,
      description,
      releaseDate
    });

    await season.save();
    series.totalSeasons += 1;
    await series.save();

    res.status(201).json({ success: true, season });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// // Add Episode to Season
router.post(
  '/episodes',
  isVendor,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video_320', maxCount: 1 },
    { name: 'video_480', maxCount: 1 },
    { name: 'video_720', maxCount: 1 },
    { name: 'video_1080', maxCount: 1 },
    { name: 'trailer', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        name,
        description,
        release_date,
        video_duration,
        episode_number,
        season_number,
        series_title,
        type_id,
        video_type,
        channel_id,
        producer_id,
        category_id,
        language_id,
        cast_id,
        video_upload_type,
        video_extension,
        is_premium,
        is_download,
        is_like,
        is_comment,
        price,
        rentDuration,
        package_id,
        packageType,
        is_rent,
        rent_day
      } = req.body;
      console.log('Received files:', req.files);

      // 1. Find Series
      const series = await Series.findOne({ title: series_title, vendor_id: req.vendor._id });
      if (!series)
        return res.status(404).json({ success: false, message: 'Series not found for this vendor' });

      // 2. Find Season
      const season = await Season.findOne({ seasonNumber: season_number, series_id: series._id });
      if (!season)
        return res.status(404).json({ success: false, message: 'Season not found in this series' });

      // 3. File Upload Helper
      // const uploadFile = async (field, folder) => {
      //           if (req.files[field]) {
      //             const file = req.files[field][0];
      //             const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      //             return await uploadToCloudinary(base64, folder, file.mimetype);
      //           }
      //           return '';
      //         };
      // 3. File Upload Helper with HEIC support
      const uploadFile = async (field, folder) => {
        if (req.files && req.files[field] && req.files[field][0]) {
          const file = req.files[field][0];

          let buffer = file.buffer;
          let mimetype = file.mimetype;

          // Convert HEIC/HEIF to JPEG
          if (mimetype === 'image/heic' || mimetype === 'image/heif') {
            const outputBuffer = await heicConvert({
              buffer: buffer,
              format: 'JPEG',
              quality: 1
            });
            buffer = outputBuffer;
            mimetype = 'image/jpeg';
          }

          const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
          return await uploadToCloudinary(base64, folder, mimetype);
        }
        return '';
      };

        
              const thumbnail = await uploadFile('thumbnail', 'episodes/thumbnails');
              const video_320 = await uploadFile('video_320', 'episodes/320');
              const video_480 = await uploadFile('video_480', 'episodes/480');
              const video_720 = await uploadFile('video_720', 'episodes/720');
              const video_1080 = await uploadFile('video_1080', 'episodes/1080');
              const trailer_url = await uploadFile('trailer', 'episodes/trailers');

      // 5. Create Episode Document
      const episode = new Episode({
        name,
        description,
        release_date,
        video_duration: Number(video_duration),
        thumbnail,
        video_320,
        video_480,
        video_720,
        video_1080,
        trailer_url,
        type_id: type_id ? new mongoose.Types.ObjectId(type_id) : null,
        video_type,
        channel_id: channel_id ? new mongoose.Types.ObjectId(channel_id) : null,
        producer_id: producer_id ? new mongoose.Types.ObjectId(producer_id) : null,
        category_id: category_id ? new mongoose.Types.ObjectId(category_id) : null,
        language_id: language_id ? new mongoose.Types.ObjectId(language_id) : null,
        cast_id: cast_id ? new mongoose.Types.ObjectId(cast_id) : null,
        vendor_id: req.vendor._id,
        video_upload_type,
        video_extension,
        is_premium: Number(is_premium) || 0,
        is_download: Number(is_download) || 0,
        is_like: Number(is_like) || 0,
        is_comment: Number(is_comment) || 0,
        episode_number: Number(episode_number),
        season_number: Number(season_number),
        series_id: series._id,
        season_id: season._id,
        status: 'pending',
        isApproved: false,
        price: price ? Number(price) : null,
        rentDuration: rentDuration ? Number(rentDuration) : null,
        is_rent: Number(is_rent) || 0,
        rent_day: Number(rent_day) || 0,
        package_id: package_id ? new mongoose.Types.ObjectId(package_id) : null,
        packageType
      });

      await episode.save();

      // 6. Increment episode counters
      await Season.findByIdAndUpdate(season._id, { $inc: { totalEpisodes: 1 } });
      await Series.findByIdAndUpdate(series._id, { $inc: { totalEpisodes: 1 } });

      return res.status(201).json({
        success: true,
        message: 'Episode uploaded successfully',
        episode
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Episode upload failed', error: err.message });
    }
  }
);
// Get all seasons for a specific series
router.get('/seasons/:seriesId',isVendor,async (req, res) => {
  try {
    const { seriesId } = req.params;
    const seasons = await Season.find({ series_id: seriesId }).sort({ seasonNumber: 1 }); // sort by season number if you want
    res.status(200).json({ success: true, seasons });
  } catch (error) {
    console.error('Error fetching seasons:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});
// Get all episodes for a specific season
router.get('/season/:seasonId', async (req, res) => {
  try {
    const { seasonId } = req.params;
    const episodes = await Episode.find({ season_id: seasonId })
      .sort({ episode_number: 1 }); // optional: sort by episode number
    res.status(200).json(episodes);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// routes/series.js or similar
router.get('/series/:seriesId', async (req, res) => {
  try {
    const seriesId = req.params.seriesId;

    // Get the series
    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(404).json({ success: false, message: "Series not found" });
    }

    // Get all seasons of the series
    const seasons = await Season.find({ series_id: seriesId }).sort({ season_number: 1 });

    // For each season, get episodes
    const seasonsWithEpisodes = await Promise.all(seasons.map(async (season) => {
      const episodes = await Episode.find({ season_id: season._id, series_id: seriesId })
        .populate('video_id')
        .sort({ episode_number: 1 });

      return {
        seasonDetails: season,
        episodes
      };
    }));

    res.json({
      success: true,
      series,
      seasons: seasonsWithEpisodes
    });
  } catch (error) {
    console.error('Error fetching series:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Request password reset route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find the vendor by email
    const vendor = await Vendor.findOne({ email });
    
    if (!vendor) {
      return res.status(404).json({ message: 'No vendor found with this email address' });
    }

    // Generate reset token and set expiry (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save token to vendor record
    vendor.resetToken = resetToken;
    vendor.resetTokenExpiry = resetTokenExpiry;
    await vendor.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:9000'}/reset-password/${resetToken}`;

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: vendor.email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset for your vendor account.</p>
        <p>Please click the link below to reset your password. This link is valid for 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 14px 20px; margin: 8px 0; border: none; border-radius: 4px; cursor: pointer; text-decoration: none;">Reset Password</a>
        <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'Password reset email sent successfully. Please check your email.' 
    });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// Verify reset token route
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find vendor with valid token
    const vendor = await Vendor.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() } // Token must not be expired
    });

    if (!vendor) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    // Return success if token is valid
    res.status(200).json({ message: 'Token is valid', email: vendor.email });
    
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// Reset password route
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'New password is required' });
    }

    // Find vendor with valid token
    const vendor = await Vendor.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() } // Token must not be expired
    });

    if (!vendor) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update vendor with new password and clear reset token
    vendor.password = hashedPassword;
    vendor.resetToken = undefined;
    vendor.resetTokenExpiry = undefined;
    await vendor.save();

    // Send confirmation email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
      to: vendor.email,
      subject: 'Password Reset Successful',
      html: `
        <h1>Password Reset Successful</h1>
        <p>Your password has been successfully reset.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password has been reset successfully' });
    
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// create a tv show channel - tv show - season - episode 
// router.post('/tvshows', 
//   isVendor, 
//   upload.fields([
//     { name: 'thumbnail', maxCount: 1 },
//     { name: 'landscape', maxCount: 1 }
//   ]), 
//   async (req, res) => {
//     try {
//       const { title, description, category_id, releaseYear, totalSeasons, status, tags,  channel_id } = req.body;
      
//       let thumbnailUrl = '';
//       if (req.file) {
//         try {
//           let mimeType = req.file.mimetype;
//           let imageBuffer = req.file.buffer;

//           // Convert HEIC to JPEG
//           if (mimeType === 'image/heic' || mimeType === 'image/heif') {
//             const outputBuffer = await heicConvert({
//               buffer: imageBuffer,
//               format: 'JPEG',
//               quality: 1
//             });
//             imageBuffer = outputBuffer;
//             mimeType = 'image/jpeg';
//           }

//           const base64 = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
//           thumbnailUrl = await uploadToCloudinary(base64, 'episodes/thumbnails', mimeType);

//         } catch (uploadError) {
//           console.error('Thumbnail upload error:', uploadError);
//           return res.status(400).json({
//             success: false,
//             message: 'Failed to upload thumbnail'
//           });
//         }
//       }
  
//       try {
//         thumbnailUrl = await uploadFile('thumbnail', 'tvshows/thumbnails');
//         landscapeUrl = await uploadFile('landscape', 'tvshows/landscapes');
//       } catch (uploadError) {
//         console.error('File upload error:', uploadError);
//         return res.status(400).json({
//           success: false,
//           error: 'File upload failed',
//           details: uploadError.message
//         });
//       }

//       if (!title) {
//         return res.status(400).json({
//           success: false,
//           error: 'Title is required'
//         });
//       }

//       const tvShow = new TVShow({
//         title,
//         channel_id,
//         description: description || '',
//         vendor_id: req.vendor.id,
//         category_id: category_id || null,
//         thumbnail: thumbnailUrl,
//         landscape: landscapeUrl,
//         releaseYear: releaseYear ? Number(releaseYear) : new Date().getFullYear(),
//         totalSeasons: totalSeasons ? Number(totalSeasons) : 1,
//         status: status || 'ongoing',
//         tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
//         isApproved: false,
//         rating: 0
//       });

//       await tvShow.save();

//       res.status(201).json({
//         success: true,
//         message: 'TV Show created successfully',
//         tvShow
//       });
//     } catch (error) {
//       console.error('TV Show creation error:', error);
//       res.status(500).json({
//         success: false,
//         error: 'Failed to create TV Show',
//         details: error.message
//       });
//     }
//   });
router.post('/tvshows',
  isVendor,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'landscape', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { title, description, category_id, releaseYear, totalSeasons, status, tags, channel_id } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, error: 'Title is required' });
      }

      let thumbnailUrl = '';
      let landscapeUrl = '';

      const thumbnailFile = req.files?.thumbnail?.[0];
      const landscapeFile = req.files?.landscape?.[0];

      const processUpload = async (file, folder) => {
        let mimeType = file.mimetype;
        let imageBuffer = file.buffer;

        if (mimeType === 'image/heic' || mimeType === 'image/heif') {
          const outputBuffer = await heicConvert({
            buffer: imageBuffer,
            format: 'JPEG',
            quality: 1
          });
          imageBuffer = outputBuffer;
          mimeType = 'image/jpeg';
        }

        const base64 = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
        return await uploadToCloudinary(base64, folder, mimeType);
      };

      try {
        if (thumbnailFile) {
          thumbnailUrl = await processUpload(thumbnailFile, 'tvshows/thumbnails');
        }

        if (landscapeFile) {
          landscapeUrl = await processUpload(landscapeFile, 'tvshows/landscapes');
        }
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        return res.status(400).json({ success: false, error: 'Image upload failed', details: uploadError.message });
      }

      const tvShow = new TVShow({
        title,
        channel_id,
        description: description || '',
        vendor_id: req.vendor.id,
        category_id: category_id || null,
        thumbnail: thumbnailUrl,
        landscape: landscapeUrl,
        releaseYear: releaseYear ? Number(releaseYear) : new Date().getFullYear(),
        totalSeasons: totalSeasons ? Number(totalSeasons) : 1,
        status: status || 'ongoing',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        isApproved: false,
        adminApproval: { status: 'pending', notes: '' },
        rating: 0
      });

      await tvShow.save();

      res.status(201).json({
        success: true,
        message: 'TV Show created successfully',
        tvShow
      });
    } catch (error) {
      console.error('TV Show creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create TV Show',
        details: error.message
      });
    }
  }
);
  // Get list of TV shows
router.get('/tvshows', isVendor, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      channel_id,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {
      vendor_id: req.vendor.id // Only get shows for the current vendor
    };

    // Add filters if provided
    if (status) query.status = status;
    if (channel_id) query.channel_id = channel_id;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip value for pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sortObject = {};
    sortObject[sort] = order === 'desc' ? -1 : 1;

    // Get total count for pagination
    const total = await TVShow.countDocuments(query);

    // Get TV shows
    const tvShows = await TVShow.find(query)
      .sort(sortObject)
      .skip(skip)
      .limit(Number(limit))
      .populate('channel_id', 'name') // Populate channel information
      .populate('category_id', 'name') // Populate category information
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(total / Number(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        tvShows,
        pagination: {
          total,
          page: Number(page),
          totalPages,
          hasNextPage,
          hasPrevPage,
          limit: Number(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get TV Shows error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch TV shows',
      details: error.message
    });
  }
});
// upload 
router.post(
    '/tvshows/:tvShowId/seasons/:seasonId/episodes',
    isVendor,
    upload.single('thumbnail'),
    async (req, res) => {
      try {
        const { tvShowId, seasonId } = req.params;
        const { title, description, videoUrl, duration } = req.body;
  
        // Validate required fields
        if (!title || !videoUrl) {
          return res.status(400).json({
            success: false,
            message: 'Title and video URL are required'
          });
        }

      let thumbnailUrl = '';
      if (req.file) {
        try {
          let mimeType = req.file.mimetype;
          let imageBuffer = req.file.buffer;

          // Convert HEIC to JPEG
          if (mimeType === 'image/heic' || mimeType === 'image/heif') {
            const outputBuffer = await heicConvert({
              buffer: imageBuffer,
              format: 'JPEG',
              quality: 1
            });
            imageBuffer = outputBuffer;
            mimeType = 'image/jpeg';
          }

          const base64 = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
          thumbnailUrl = await uploadToCloudinary(base64, 'episodes/thumbnails', mimeType);

        } catch (uploadError) {
          console.error('Thumbnail upload error:', uploadError);
          return res.status(400).json({
            success: false,
            message: 'Failed to upload thumbnail'
          });
        }
      }
  
        // Create new episode
        const episode = new Episode({
          title,
          description: description || '',
          videoUrl,
          duration: duration || 0,
          thumbnail: thumbnailUrl,
          tvShowId,
          seasonId,
          vendor_id: req.vendor.id
        });
  
        await episode.save();
  
        // Update season with new episode
        await Season.findByIdAndUpdate(
          seasonId,
          { $push: { episodes: episode._id } },
          { new: true }
        );
  
        res.status(201).json({
          success: true,
          message: 'Episode created successfully',
          episode
        });
      } catch (error) {
        console.error('Episode creation error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create episode',
          error: error.message
        });
      }
    }
  );
  
// POST /tvshows/:showId/seasons
router.post('/tvshows/:showId/seasons', isVendor, async (req, res) => {
  try {
    const { showId } = req.params;
    const { seasons } = req.body;

    // Ensure the TV Show exists
    const tvShow = await TVShow.findById(showId);
    if (!tvShow) {
      return res.status(404).json({
        success: false,
        error: 'TV Show not found'
      });
    }

    // Parse and validate seasons input
    let seasonArray = [];
    try {
      seasonArray = typeof seasons === 'string' ? JSON.parse(seasons) : seasons;
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid seasons format. Expected a valid JSON array.'
      });
    }

    const createdSeasons = [];

    for (const season of seasonArray) {
      if (!season.name) continue;

      const newSeason = new TVSeason({
        show_id: showId,
        name: season.name,
        description: season.description || '',
        status: 1
      });

      await newSeason.save();
      createdSeasons.push(newSeason);
    }

    res.status(201).json({
      success: true,
      message: 'Seasons added successfully',
      seasons: createdSeasons
    });

  } catch (error) {
    console.error('Add Season error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add seasons',
      details: error.message
    });
  }
});
// GET /tvshows/:showId/seasons
router.get('/tvshows/:showId/seasons', async (req, res) => {
  try {
    const { showId } = req.params;

    // Ensure the TV Show exists
    const tvShow = await TVShow.findById(showId);
    if (!tvShow) {
      return res.status(404).json({
        success: false,
        error: 'TV Show not found'
      });
    }

    // Find all seasons linked to this TV show
    const seasons = await TVSeason.find({ show_id: showId });

    res.status(200).json({
      success: true,
      seasons
    });
  } catch (error) {
    console.error('Get Seasons error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve seasons',
      details: error.message
    });
  }
});

// Add Episode to TV Show Season
// router.post(
//   '/tv-episodes',
//   isVendor,
//   upload.fields([
//     { name: 'thumbnail', maxCount: 1 },
//     { name: 'landscape', maxCount: 1 },
//     { name: 'video_320', maxCount: 1 },
//     { name: 'video_480', maxCount: 1 },
//     { name: 'video_720', maxCount: 1 },
//     { name: 'video_1080', maxCount: 1 },
//     { name: 'trailer', maxCount: 1 }
//   ]),
//   async (req, res) => {
//     try {
//       const {
//         show_id,
//         season_id,
//         episode_number,
//         title,
//         description,
//         video_upload_type,
//         video_extension,
//         video_duration,
//         trailer_type,
//         release_date,
//         is_premium,
//         is_rent,
//         price,
//         rent_day,
//         is_like,
//         is_comment,
//         cast_id,
//         producer_id,
//         language_id,
//         category_id,
//         subtitles,
//         tags
//       } = req.body;

//       // ✅ Validate Show
//       if (!mongoose.Types.ObjectId.isValid(show_id)) {
//         return res.status(400).json({ success: false, message: 'Invalid show ID' });
//       }
//       const show = await TVShow.findOne({ _id: show_id, vendor_id: req.vendor._id });
//       if (!show) return res.status(404).json({ success: false, message: 'TV show not found' });

//       // ✅ Validate Season
//       if (!mongoose.Types.ObjectId.isValid(season_id)) {
//         return res.status(400).json({ success: false, message: 'Invalid season ID' });
//       }
//       const season = await TVSeason.findOne({ _id: season_id, show_id: show_id });
//       if (!season) return res.status(404).json({ success: false, message: 'TV season not found for the given show' });

//       // ✅ Upload helper
//       const uploadFile = async (field, folder) => {
//         if (req.files && req.files[field]) {
//           const file = req.files[field][0];
//           const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
//           return await uploadToCloudinary(base64, folder, file.mimetype);
//         }
//         return '';
//       };

//       // ✅ Upload media
//       const thumbnail = await uploadFile('thumbnail', 'tv/episodes/thumbnails');
//       const landscape = await uploadFile('landscape', 'tv/episodes/landscape');
//       const video_320 = await uploadFile('video_320', 'tv/episodes/320');
//       const video_480 = await uploadFile('video_480', 'tv/episodes/480');
//       const video_720 = await uploadFile('video_720', 'tv/episodes/720');
//       const video_1080 = await uploadFile('video_1080', 'tv/episodes/1080');
//       const trailer_url = await uploadFile('trailer', 'tv/episodes/trailers');

//       // ✅ Parse subtitles
//       let parsedSubtitles = [];
//       if (subtitles) {
//         try {
//           parsedSubtitles = JSON.parse(subtitles); // expecting format: [{ language: '', url: '' }]
//         } catch (err) {
//           return res.status(400).json({ success: false, message: 'Invalid subtitles format' });
//         }
//       }

//       // ✅ Create and save episode
//       const episode = new TvEpisode({
//         show_id: show._id,
//         season_id: season._id,
//         episode_number: Number(episode_number),
//         title,
//         description,
//         thumbnail,
//         landscape,
//         video_upload_type,
//         video_extension,
//         video_duration: Number(video_duration),
//         video_320,
//         video_480,
//         video_720,
//         video_1080,
//         trailer_type,
//         trailer_url,
//         subtitles: parsedSubtitles,
//         cast_id,
//         producer_id,
//         language_id,
//         category_id,
//         is_premium: Number(is_premium) || 0,
//         is_rent: Number(is_rent) || 0,
//         price: Number(price) || 0,
//         rent_day: Number(rent_day) || 0,
//         is_like: Number(is_like) || 0,
//         is_comment: Number(is_comment) || 0,
//         vendor_id: req.vendor._id,
//         release_date,
//         tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
//         status: 'pending',
//         isApproved: false
//       });

//       await episode.save();

//       return res.status(201).json({
//         success: true,
//         message: 'TV Episode created successfully',
//         episode
//       });

//     } catch (err) {
//       console.error('Episode creation error:', err);
//       res.status(500).json({ success: false, message: 'Error creating episode', error: err.message });
//     }
//   }
// );
router.post(
  '/tv-episodes',
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
      const {
        show_id,
        season_id,
        episode_number,
        title,
        description,
        video_upload_type,
        video_extension,
        video_duration,
        trailer_type,
        release_date,
        is_premium,
        is_rent,
        price,
        rent_day,
        is_like,
        is_comment,
        cast_id,
        producer_id,
        language_id,
        category_id,
        subtitles,
        tags
      } = req.body;

      // ✅ Validate Show
      if (!mongoose.Types.ObjectId.isValid(show_id)) {
        return res.status(400).json({ success: false, message: 'Invalid show ID' });
      }
      const show = await TVShow.findOne({ _id: show_id, vendor_id: req.vendor._id });
      if (!show) return res.status(404).json({ success: false, message: 'TV show not found' });

      // ✅ Validate Season
      if (!mongoose.Types.ObjectId.isValid(season_id)) {
        return res.status(400).json({ success: false, message: 'Invalid season ID' });
      }
      const season = await TVSeason.findOne({ _id: season_id, show_id: show_id });
      if (!season) return res.status(404).json({ success: false, message: 'TV season not found for the given show' });

      // ✅ Helper function to safely convert to number
      const safeNumber = (value, defaultValue = 0) => {
        if (!value || value === '' || value === null || value === undefined) {
          return defaultValue;
        }
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
      };

      // ✅ Upload helper
      const uploadFile = async (field, folder) => {
        if (req.files && req.files[field]) {
          const file = req.files[field][0];
          const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          return await uploadToCloudinary(base64, folder, file.mimetype);
        }
        return '';
      };

      // ✅ Upload media
      const thumbnail = await uploadFile('thumbnail', 'tv/episodes/thumbnails');
      const landscape = await uploadFile('landscape', 'tv/episodes/landscape');
      const video_320 = await uploadFile('video_320', 'tv/episodes/320');
      const video_480 = await uploadFile('video_480', 'tv/episodes/480');
      const video_720 = await uploadFile('video_720', 'tv/episodes/720');
      const video_1080 = await uploadFile('video_1080', 'tv/episodes/1080');
      const trailer_url = await uploadFile('trailer', 'tv/episodes/trailers');

      // ✅ Parse subtitles
      let parsedSubtitles = [];
      if (subtitles) {
        try {
          parsedSubtitles = JSON.parse(subtitles); // expecting format: [{ language: '', url: '' }]
        } catch (err) {
          return res.status(400).json({ success: false, message: 'Invalid subtitles format' });
        }
      }

      // ✅ Create and save episode with safe number conversion
      const episode = new TvEpisode({
        show_id: show._id,
        season_id: season._id,
        episode_number: safeNumber(episode_number, 1),
        title,
        description,
        thumbnail,
        landscape,
        video_upload_type,
        video_extension,
        video_duration: safeNumber(video_duration, 0), // ✅ Safe conversion
        video_320,
        video_480,
        video_720,
        video_1080,
        trailer_type,
        trailer_url,
        subtitles: parsedSubtitles,
        cast_id,
        producer_id,
        language_id,
        category_id,
        is_premium: safeNumber(is_premium, 0),
        is_rent: safeNumber(is_rent, 0),
        price: safeNumber(price, 0),
        rent_day: safeNumber(rent_day, 0),
        is_like: safeNumber(is_like, 0),
        is_comment: safeNumber(is_comment, 0),
        vendor_id: req.vendor._id,
        release_date,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        status: 'pending',
        isApproved: false
      });

      await episode.save();

      return res.status(201).json({
        success: true,
        message: 'TV Episode created successfully',
        episode
      });

    } catch (err) {
      console.error('Episode creation error:', err);
      res.status(500).json({ success: false, message: 'Error creating episode', error: err.message });
    }
  }
);
// Get all channels
//Add this new endpoint to get channels
router.get('/get-channels', async (req, res) => {
  try {
    const channels = await Channel.find();
    console.log("channels"+" "+channels);
    res.status(200).json({ channels });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// testting all below 
// Middleware to update vendor's wallet with earnings
const updateVendorWallet = async (vendorId, earnings) => {
  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // 90-day lock period logic
    vendor.lockedBalance += earnings; // New earnings go to locked balance
    await vendor.save();

    return vendor;
  } catch (error) {
    throw error;
  }
};

// Get vendor earnings and update wallet
router.get('/testing-vendor-earnings', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const earnings = vendor.totalViews * admin.pricePerView;
    
    // Update vendor's wallet with new earnings
    await updateVendorWallet(vendorId, earnings);

    // Calculate available and locked balance
    const currentDate = new Date();
    const ninetyDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 90));

    // Move balance from locked to available if 90 days have passed
    if (vendor.lockedBalance > 0) {
      const availableAmount = vendor.lockedBalance;
      vendor.wallet += availableAmount;
      vendor.lockedBalance -= availableAmount;
      await vendor.save();
    }

    res.json({
      success: true,
      vendorId: vendor._id,
      totalViews: vendor.totalViews,
      pricePerView: admin.pricePerView,
      totalEarnings: earnings,
      availableBalance: vendor.wallet,
      lockedBalance: vendor.lockedBalance,
      totalBalance: vendor.wallet + vendor.lockedBalance,
      vendor
    });

  } catch (error) {
    console.error('Error fetching vendor earnings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get vendor wallet details
router.get('/wallet-details', isVendor, async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    res.json({
      success: true,
      availableBalance: vendor.wallet,
      lockedBalance: vendor.lockedBalance,
      totalBalance: vendor.wallet + vendor.lockedBalance
    });

  } catch (error) {
    console.error('Error fetching wallet details:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Periodic task to update locked balance (should be run daily)
const updateLockedBalances = async () => {
  try {
    const vendors = await Vendor.find({ lockedBalance: { $gt: 0 } });
    const currentDate = new Date();
    const ninetyDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 90));

    for (const vendor of vendors) {
      // Move balance from locked to available if 90 days have passed
      const availableAmount = vendor.lockedBalance;
      vendor.wallet += availableAmount;
      vendor.lockedBalance -= availableAmount;
      await vendor.save();
    }
  } catch (error) {
    console.error('Error updating locked balances:', error);
  }
};

// Schedule the task to run daily
// You can use a job scheduler like node-cron
const cron = require('node-cron');
cron.schedule('0 0 * * *', () => {
  updateLockedBalances();
});

// // Vendor creates withdrawal request
// router.post('/request-withdrawal', isVendor, async (req, res) => {
//   try {
//     const { amount } = req.body;
//     const vendorId = req.vendor.id;

//     // Find vendor
//     const vendor = await Vendor.findById(vendorId);
//     if (!vendor) {
//       return res.status(404).json({ success: false, message: 'Vendor not found' });
//     }

//     // Check if amount is available in wallet
//     if (vendor.wallet < amount) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Insufficient balance in wallet' 
//       });
//     }

//     // Check 90-day lock period
//     const ninetyDaysAgo = new Date();
//     ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

//     if (vendor.lockedBalance > 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Some amount is still in 90-day lock period' 
//       });
//     }

//     // Create withdrawal request
//     const withdrawalRequest = new WithdrawalRequest({
//       vendor: vendorId,
//       amount,
//       status: 'pending'
//     });

//     // Move amount from wallet to lockedBalance
//     vendor.wallet -= amount;
//     vendor.lockedBalance += amount;

//     await withdrawalRequest.save();
//     await vendor.save();

//     res.status(201).json({
//       success: true,
//       message: 'Withdrawal request created successfully',
//       data: withdrawalRequest
//     });

//   } catch (error) {
//     console.error('Error in withdrawal request:', error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });
// Vendor creates withdrawal request
router.post('/request-withdrawal', isVendor, async (req, res) => {
  try {
    const { amount } = req.body;
    const vendorId = req.vendor.id;

    // Find vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // 🔒 Check active lock period
    const lockPeriod = await VendorLockPeriod.findOne({
      vendorId,
      isActive: true,
      endDate: { $gt: new Date() }
    });

    if (lockPeriod) {
      const remainingDays = lockPeriod.getRemainingDays ? lockPeriod.getRemainingDays() : 0;

      return res.status(403).json({
        success: false,
        message: `Withdrawals are locked. You can request a withdrawal after ${remainingDays} day(s).`
      });
    }

    // 💰 Check if amount is available in wallet
    if (vendor.wallet < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance in wallet' 
      });
    }

    // 🪙 Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      vendor: vendorId,
      amount,
      status: 'pending'
    });

    // Move amount from wallet to lockedBalance
    vendor.wallet -= amount;
    vendor.lockedBalance += amount;

    await withdrawalRequest.save();
    await vendor.save();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: withdrawalRequest
    });

  } catch (error) {
    console.error('Error in withdrawal request:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// Vendor gets their withdrawal requests
router.get('/my-requests', isVendor, async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find({ vendor: req.vendor.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

//upload video  (its simple uploading without doing the rentals videos and all )
// POST /create-short - Upload a short video (thumbnail + single video)
// POST /api/shorts - Create new short (with video upload)
const cpUpload = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);
router.post('/upload-shorts', cpUpload, async (req, res) => {
  try {
    const {
      name,
      description,
      vendor_id, 
      category_id,
      language_id
    } = req.body;

    if (!name || !vendor_id || !req.files['video']) {
      return res.status(400).json({
        success: false,
        message: 'Name, vendor_id, and video are required'
      });
    }

    const videoFile = req.files['video'][0];

    // Upload video to Cloudinary
    const videoUpload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'shorts/videos',
          format: 'mp4',
          transformation: [
            { width: 720, height: 1280, crop: 'limit' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(videoFile.buffer);
    });

    let thumbnailUrl = '';

    if (req.files['thumbnail']) {
      const thumbnailFile = req.files['thumbnail'][0];
      const thumbUpload = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'shorts/thumbnails',
            resource_type: 'image',
            format: 'jpg',
            transformation: [{ width: 360, height: 640, crop: 'fill' }]
          },
          (error, result) => error ? reject(error) : resolve(result)
        );
        stream.end(thumbnailFile.buffer);
      });
      thumbnailUrl = thumbUpload.secure_url;
    } else {
      // Auto-generate thumbnail from video
      thumbnailUrl = cloudinary.url(videoUpload.public_id + '.jpg', {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { width: 360, height: 640, crop: 'fill' },
          { start_offset: '2' }
        ]
      });
    }

    const duration = videoUpload.duration || 0;
    if (duration > 60) {
      await cloudinary.uploader.destroy(videoUpload.public_id, { resource_type: 'video' });
      return res.status(400).json({
        success: false,
        message: 'Video must be 60 seconds or shorter'
      });
    }

    const newShort = new Shorts({
      vendor_id,
      category_id: category_id || null,
      language_id: language_id || null,
      name: name.trim(),
      description: description || '',
      thumbnail: thumbnailUrl,
      video_url: videoUpload.secure_url,
      video_extension: videoUpload.format,
      video_duration: Math.round(duration),
    });

    const saved = await newShort.save();

    const populated = await Shorts.findById(saved._id)
      .populate('vendor_id', 'name email')
      .populate('category_id', 'name')
      .populate('language_id', 'name');

    res.status(201).json({
      success: true,
      message: 'Short uploaded successfully',
      data: populated
    });

  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: err.message
    });
  }
});
// router.get('/get-shortbyid',async(req,res)=>{

// })
router.get('/get_shorts', async (req, res) => {
  try {
    // Adjust this query as needed
    const shorts = await Video.find({
      isApproved: true,
      $or: [
        { video_type: 'short' },
        { video_duration: { $lt: 60 } }
      ]
    })
    .populate('type_id', 'name') // optionally include type name
    .sort({ createdAt: -1 }); // optional: newest first

    return res.status(200).json({
      message: 'Short videos fetched successfully',
      data: shorts
    });
  } catch (error) {
    console.error('Error fetching short videos:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
router.post("/set-target", isVendor, async (req, res) => {
  const { target } = req.body;

  if (!target || isNaN(target)) {
    return res.status(400).json({ success: false, message: "Invalid target amount" });
  }

  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    vendor.monthlyTarget = target;
    await vendor.save();
    const monthly_target= vendor.monthlyTarget
    res.json({ success: true, monthly_target, message: "Target updated successfully" });
  } catch (error) {
    console.error("Error setting target:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// GET /get-target - Get vendor's current monthly target
router.get("/get-target", isVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    res.json({ success: true, monthly_target: vendor.monthlyTarget || 0 });
  } catch (error) {
    console.error("Error fetching target:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// set target for users 
// Update Monthly Target
router.post("/set-target-users", isVendor, async (req, res) => {
  const { target } = req.body;

  if (!target || isNaN(target)) {
    return res.status(400).json({ success: false, message: "Invalid target amount" });
  }

  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    vendor.monthlyTargetUser = target;
    await vendor.save();
    const monthly_target_users= vendor.monthlyTargetUser
    res.json({ success: true, monthly_target_users, message: "Target updated successfully" });
  } catch (error) {
    console.error("Error setting target:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// GET /get-target-users - Get vendor's current monthly users target
router.get("/get-target-users", isVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    res.json({ success: true, monthly_target_users: vendor.monthlyTargetUser || 0 });
  } catch (error) {
    console.error("Error fetching target:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// In your video routes file
router.get('/filter-videos-by', async (req, res) => {
  try {
    const { type, category } = req.query;
    
    // Input validation
    if (!type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type parameter is required' 
      });
    }

    // First try to find by name
    let videoType = await Type.findOne({
      name: { $regex: new RegExp(`^${type}$`, 'i') }
    });
    console.log("video type"+videoType)

    // If not found by name, try to find by type number
    if (!videoType) {
      videoType = await Type.findOne({ type: Number(type) });
    }
    
    if (!videoType) {
      return res.status(404).json({ 
        success: false, 
        message: `Video type '${type}' not found` 
      });
    }

    // Build the base query with both type_id and video_type
    let query = {
      $or: [
        { type_id: videoType._id },
        { video_type: videoType.name.toLowerCase() }
      ]
    };
      console.log(query);
    // Add category filter if provided
    if (category) {
      query.category_id = category;
    }

    console.log('Query:', query); // Debug log
     
    // Fetch videos with populated fields
    const videos = await Video.find(query)
      .populate('category_id', 'name')
      .populate('type_id', 'name type')
      .populate('finalPackage_id', 'name price')
      .populate('vendor_id', 'name')
      .populate('channel_id', 'name')
      .populate('producer_id', 'name')
      .sort({ createdAt: -1 });
    console.log("videos this are"+videos)
    console.log('Found videos:', videos.length); // Debug log

    // Return success response with videos
    res.json({
      success: true,
      count: videos.length,
      type: videoType.name,
      typeId: videoType._id, // Include type ID in response
      videos: videos.map(video => ({
        ...video.toObject(),
        type_name: videoType.name,
        type_number: videoType.type
      }))
    });

  } catch (error) {
    console.error('Error in filter-videos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching videos',
      error: error.message 
    });
  }
});
// In your video routes file
router.get('/filter-videos-bywebseries', async (req, res) => {
  try {
    const { type, category } = req.query;
    
    // Input validation
    if (!type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type parameter is required' 
      });
    }

    // First try to find by name
    let videoType = await Type.findOne({
      name: { $regex: new RegExp(`^${type}$`, 'i') }
    });
    console.log("video type"+videoType)

    // If not found by name, try to find by type number
    if (!videoType) {
      videoType = await Type.findOne({ type: Number(type) });
    }
    
    if (!videoType) {
      return res.status(404).json({ 
        success: false, 
        message: `Video type '${type}' not found` 
      });
    }

    // Build the base query with both type_id and video_type
    let query = {
      $or: [
        { type_id: videoType._id },
        { video_type: videoType.name.toLowerCase() }
      ]
    };
      console.log(query);
    // Add category filter if provided
    if (category) {
      query.category_id = category;
    }

    console.log('Query:', query); // Debug log
     
    // Fetch videos with populated fields
    const videos = await Series.find(query)
      .populate('category_id', 'name')
      .populate('type_id', 'name type')
      // .populate('finalPackage_id', 'name price')
      .populate('vendor_id', 'name')
      // .populate('channel_id', 'name')
      // .populate('producer_id', 'name')
      .sort({ createdAt: -1 });
    console.log("videos this are"+videos)
    console.log('Found videos:', videos.length); // Debug log

    // Return success response with videos
    res.json({
      success: true,
      count: videos.length,
      type: videoType.name,
      typeId: videoType._id, // Include type ID in response
      videos: videos.map(video => ({
        ...video.toObject(),
        type_name: videoType.name,
        type_number: videoType.type
      }))
    });

  } catch (error) {
    console.error('Error in filter-videos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching videos',
      error: error.message 
    });
  }
});
// get the series , season , all its episode 
router.get('/get-seriesrelatedinformation', async (req, res) => {
  try {
    const { type, category } = req.query;

    if (!type) {
      return res.status(400).json({ success: false, message: 'Type parameter is required' });
    }

    let videoType = await Type.findOne({ name: new RegExp(`^${type}$`, 'i') });

    if (!videoType) {
      videoType = await Type.findOne({ type: Number(type) });
    }

    if (!videoType) {
      return res.status(404).json({ success: false, message: `Video type '${type}' not found` });
    }

    const query = {
      $or: [
        { type_id: videoType._id },
        { video_type: videoType.name.toLowerCase() }
      ]
    };

    if (category) {
      query.category_id = category;
    }

    const seriesList = await Series.find(query)
      .populate('category_id', 'name')
      .populate('type_id', 'name type')
      .populate('vendor_id', 'name')
      .sort({ createdAt: -1 });

    const result = await Promise.all(seriesList.map(async (series) => {
      const seasons = await Season.find({ series_id: series._id }).sort({ seasonNumber: 1 });

      const seasonsWithEpisodes = await Promise.all(seasons.map(async (season) => {
        const episodes = await Episode.find({ series_id: series._id, season_id: season._id })
          .sort({ episode_number: 1 });
        return {
          ...season.toObject(),
          episodes
        };
      }));

      return {
        ...series.toObject(),
        seasons: seasonsWithEpisodes
      };
    }));

    res.json({
      success: true,
      count: result.length,
      type: videoType.name,
      typeId: videoType._id,
      series: result
    });

  } catch (error) {
    console.error('Error fetching web series:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching web series data',
      error: error.message
    });
  }
});
// GET /admin/series-by-approval?status=approved|pending|rejected
router.get('/series-by-approval', async (req, res) => {
  try {
    const { status } = req.query;

    if (!['approved', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const series = await Series.find({ approvalStatus: status })
    .populate('category_id', 'name') // ✅ This is the key line
      // .populate('vendor_id', 'name email')
      // .populate('approvedBy', 'name email');

    return res.status(200).json({ success: true, series });
  } catch (error) {
    console.error('Error fetching series by approval status:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});
// GET full series details with seasons and episodes
router.get('/:id/details', async (req, res) => {
  try {
    const seriesId = req.params.id;

    // Get the series
    const series = await Series.findById(seriesId).lean();
    if (!series) return res.status(404).json({ message: 'Series not found' });

    // Get seasons for the series
    const seasons = await Season.find({ series_id: seriesId }).sort({ seasonNumber: 1 }).lean();

    // For each season, get its episodes
    const seasonsWithEpisodes = await Promise.all(
      seasons.map(async (season) => {
        const episodes = await Episode.find({ season_id: season._id })
          .sort({ episode_number: 1 })
          .lean();

        return {
          ...season,
          episodes: episodes
        };
      })
    );

    // Final response
    return res.json({
      ...series,
      seasons: seasonsWithEpisodes
    });

  } catch (err) {
    console.error('Error fetching series details:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});
// GET full TV show details with channel, seasons, and episodes
router.get('/:id/details-tvshows', async (req, res) => {
  try {
    const showId = req.params.id;

    // Fetch the TV show by ID, populate channel info (name, etc.)
    const tvShow = await TVShow.findById(showId)
      .populate('channel_id', 'name description') // adjust fields as needed
      .lean();

    if (!tvShow) {
      return res.status(404).json({ message: 'TV show not found' });
    }

    // Get seasons for this show, sorted by creation or name
    const seasons = await TVSeason.find({ show_id: showId })
      .sort({ name: 1 }) // or any season order you want
      .lean();

    // For each season, get episodes sorted by episode_number
    const seasonsWithEpisodes = await Promise.all(
      seasons.map(async (season) => {
        const episodes = await TvEpisode.find({ season_id: season._id })
          .sort({ episode_number: 1 })
          .lean();

        return {
          ...season,
          episodes
        };
      })
    );

    // Final combined response
    return res.json({
      ...tvShow,
      seasons: seasonsWithEpisodes
    });

  } catch (err) {
    console.error('Error fetching TV show details:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});
router.get('/tvshows-by-approval', async (req, res) => {
  try {
    const { status } = req.query;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status query parameter is required' });
    }

    const allowedStatuses = ['pending', 'approved', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const series = await TVShow.find({ approvalStatus: status })
      .populate('vendor_id', 'name email')
      .populate('category_id', 'name')
      .populate('channel_id', 'name')

    return res.status(200).json({ success: true, series });
  } catch (error) {
    console.error('Error fetching series by approval status:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});
router.post("/set-target-videos", isVendor, async (req, res) => {
  const { target } = req.body;

  if (!target || isNaN(target)) {
    return res.status(400).json({ success: false, message: "Invalid target amount" });
  }

  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    vendor.monthlyTargetVideo = target;
    await vendor.save();
    const monthly_target_videos= vendor.monthlyTargetVideo
    res.json({ success: true, monthly_target_videos, message: "Target updated successfully" });
  } catch (error) {
    console.error("Error setting target:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// GET /get-target-users - Get vendor's current monthly users target
router.get("/get-target-videos", isVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    res.json({ success: true, monthlyTargetVideo: vendor.monthlyTargetVideo || 0 });
  } catch (error) {
    console.error("Error fetching target:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// transactions 
router.post('/withdrawal/requests', isVendor, createWithdrawalRequest);
router.get('/withdrawal/requests', isVendor, getVendorWithdrawalRequests);
router.get('/api/vendor/wallet', isVendor, getVendorWalletInfo);
// contests
// 5. VENDOR REGISTER FOR CONTEST
router.post('/contests/:id/register',isVendor, async (req, res) => {
  
  try {
    const { video_id } = req.body;
   
    const contest = await Contest.findById(req.params.id);
   
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found' });
    }

    // Check if registration is open
    const now = new Date();
    if (now < contest.registrationStartDate || now > contest.registrationEndDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Registration is not open for this contest' 
      });
    }

    // Check if video exists
    const video = await Video.findById(video_id);
    if (!video) {
      return res.status(400).json({ 
        success: false, 
        message: 'Video not found. Please add the video first before registering.' 
      });
    }

    // Check if vendor owns the video
    const vendorId= await Vendor.findById(req.vendor.id);
    console.log("this is the vendor "+ vendorId)
    if (video.vendor_id.toString() !== req.vendor.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only register with your own videos' 
      });
    }

    // Check if already registered
    const existingRegistration = contest.registrations.find(
      reg => reg.vendor_id.toString() === req.vendor.id
    );

    if (existingRegistration) {
      return res.status(400).json({ success: false, message: 'Already registered for this contest' });
    }

    // Add registration
    contest.registrations.push({
      vendor_id: req.vendor.id,
      video_id: video_id,
      registrationDate: new Date()
    });

    await contest.save();
    
    res.json({ 
      success: true, 
      message: 'Registration submitted successfully. Wait for admin approval.',
      data: contest.registrations[contest.registrations.length - 1]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 12. GET VENDOR'S CONTESTS
router.get('/vendors/:vendorId/contests', async (req, res) => {
  try {
    const contests = await Contest.find({
      $or: [
        { 'registrations.vendor_id': req.params.vendorId },
        { 'participants.vendor_id': req.params.vendorId }
      ]
    }).populate('type_id');

    res.json({ success: true, data: contests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
