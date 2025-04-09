// Import required modules
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { uploadToCloudinary } = require("../utils/cloudinary");
const Movie = require('../models/Movie');
const Vendors = require("../models/Vendor");
const storage = multer.memoryStorage();
const {isVendor}= require("../middleware/auth")
const upload = multer({ storage: storage });
const Vendor = require("../models/Vendor");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Content = require("../models/Content");
const category = require("../models/Category")
const UpcomingContent = require('../models/UpcomingContent');

// Configucre Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// Configure multer
// const upload = multer({ 
//   storage: storage,
//   limits: {
//     fileSize: 1024 * 1024 * 100 // 100MB limit (Cloudinary has its own limits)
//   }
// });

// Fields for upload
const uploadFields = [
  { name: 'video', maxCount: 1 },
  { name: 'poster', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'subtitle_1', maxCount: 1 },
  { name: 'subtitle_2', maxCount: 1 },
  { name: 'subtitle_3', maxCount: 1 }
];

// Handle multer errors
// const handleMulterError = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         error: 'File size is too large. Maximum size is 100MB.'
//       });
//     }
//     return res.status(400).json({
//       success: false,
//       error: `Upload error: ${err.message}`
//     });
//   } else if (err) {
//     return res.status(400).json({
//       success: false,
//       error: err.message
//     });
//   }
//   next();
// };

// // Upload video endpoint
// router.post(
//   '/vendor/upload-video',
  
//   upload.fields(uploadFields), // Reuse the correct field definitions ,
//   handleMulterError,
//   async (req, res) => {
//     console.log(req.body);
//     try {
//       // Check if files were uploaded
//       if (!req.files || !req.files.video) {
//         return res.status(400).json({
//           success: false,
//           error: 'Video file is required'
//         });
//       }

//       if (!req.files.poster) {
//         return res.status(400).json({
//           success: false,
//           error: 'Poster image is required'
//         });
//       }

//       // Get vendor details (assuming isVendor middleware sets the vendor info)
//       const vendor = req.vendor;
      
//       // Process metadata
//       const {
//         title,
//         description,
//         categories,
//         releaseYear,
//         duration,
//         ageRating,
//         language,
//         director,
//         cast,
//         subtitleLanguages,
//         rentalPrice,
//         purchasePrice,
//         isSubscriptionOnly
//       } = req.body;

//       // Validate required fields
//       if (!title || !description || !categories || !releaseYear || !duration || !language) {
//         return res.status(400).json({
//           success: false,
//           error: 'Missing required video details'
//         });
//       }

//       // Process cast (convert from JSON string if needed)
//       let castArray = [];
//       if (cast) {
//         try {
//           castArray = typeof cast === 'string' ? JSON.parse(cast) : cast;
//         } catch (e) {
//           console.error('Error parsing cast JSON:', e);
//           return res.status(400).json({
//             success: false,
//             error: 'Invalid cast format'
//           });
//         }
//       }

//       // Process subtitles
//       const subtitles = [];
//       if (req.files.subtitle_1 && subtitleLanguages) {
//         const languages = typeof subtitleLanguages === 'string' 
//           ? JSON.parse(subtitleLanguages) 
//           : subtitleLanguages;
        
//         if (req.files.subtitle_1 && languages[0]) {
//           subtitles.push({
//             language: languages[0],
//             url: req.files.subtitle_1[0].path // Cloudinary URL
//           });
//         }
        
//         if (req.files.subtitle_2 && languages[1]) {
//           subtitles.push({
//             language: languages[1],
//             url: req.files.subtitle_2[0].path // Cloudinary URL
//           });
//         }
        
//         if (req.files.subtitle_3 && languages[2]) {
//           subtitles.push({
//             language: languages[2],
//             url: req.files.subtitle_3[0].path // Cloudinary URL
//           });
//         }
//       }

//       // Create new movie object with Cloudinary URLs
//       const newMovie = new Movie({
//         title,
//         description,
//         // vendor: vendor._id,
//         categories: categories.split(','), // Assuming comma-separated category ids
//         releaseYear: parseInt(releaseYear),
//         duration: parseInt(duration),
//         ageRating: ageRating || 'Unrated',
//         poster: req.files.poster[0].path, // Cloudinary URL
//         language,
//         director,
//         cast: castArray,
//         subtitles,
//         pricing: {
//           rentalPrice: parseFloat(rentalPrice) || 0,
//           purchasePrice: parseFloat(purchasePrice) || 0,
//           isSubscriptionOnly: isSubscriptionOnly === 'true'
//         },
//         mediaFiles: {
//           original: {
//             url: req.files.video[0].path, // Cloudinary URL
//             size: req.files.video[0].size,
//             publicId: req.files.video[0].filename // Store publicId for future management
//           },
//           qualities: {} // Will be handled by Cloudinary's adaptive streaming
//         },
//         status: 'pending',
//         isNewRelease: true
//       });

//       // Add trailer URL if provided
//       if (req.body.trailerUrl) {
//         newMovie.trailerUrl = req.body.trailerUrl;
//       }

//       // Add thumbnail if uploaded
//       if (req.files.thumbnail) {
//         newMovie.thumbnail = req.files.thumbnail[0].path; // Cloudinary URL
//       }

//       // Save movie
//       await newMovie.save();

//       // Update vendor uploaded movies
//       vendor.uploadedMovies.push(newMovie._id);
//       await vendor.save();

//       // Request video optimization from Cloudinary (for adaptive streaming)
//       // This could be a separate function that uses Cloudinary's API to create different quality versions
//       // generateAdaptiveStreaming(req.files.video[0].filename);

//       res.status(201).json({
//         success: true,
//         message: 'Video uploaded successfully. Waiting for admin approval.',
//         movie: {
//           id: newMovie._id,
//           title: newMovie.title,
//           status: newMovie.status
//         }
//       });
//     } catch (error) {
//       console.error('Error uploading video:', error);
//       res.status(500).json({
//         success: false,
//         error: 'Server error during video upload'
//       });
//     }
//   }
// );

// // Delete video (only if pending) - with Cloudinary cleanup
// router.delete('/vendor/videos/:id', isVendor, async (req, res) => {
//   try {
//     const vendor = req.vendor;
    
//     const movie = await Movie.findById(req.params.id);
//     if (!movie) {
//       return res.status(404).json({
//         success: false,
//         error: 'Video not found'
//       });
//     }

//     // Security check: Ensure the vendor owns this movie
//     if (movie.vendor.toString() !== vendor._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         error: 'Not authorized to delete this video'
//       });
//     }

//     // Only allow deletion of pending videos
//     if (movie.status !== 'pending') {
//       return res.status(400).json({
//         success: false,
//         error: `Cannot delete a video that has been ${movie.status}`
//       });
//     }

//     // Delete files from Cloudinary
//     try {
//       // Delete video from Cloudinary
//       if (movie.mediaFiles?.original?.publicId) {
//         await cloudinary.uploader.destroy(movie.mediaFiles.original.publicId, { resource_type: 'video' });
//       }

//       // Extract and delete poster's public id
//       if (movie.poster) {
//         const posterPublicId = movie.poster.split('/').pop().split('.')[0];
//         await cloudinary.uploader.destroy(posterPublicId);
//       }

//       // Extract and delete thumbnail's public id
//       if (movie.thumbnail) {
//         const thumbnailPublicId = movie.thumbnail.split('/').pop().split('.')[0];
//         await cloudinary.uploader.destroy(thumbnailPublicId);
//       }

//       // Delete subtitles
//       for (const subtitle of movie.subtitles) {
//         if (subtitle.url) {
//           const subtitlePublicId = subtitle.url.split('/').pop().split('.')[0];
//           await cloudinary.uploader.destroy(subtitlePublicId, { resource_type: 'raw' });
//         }
//       }
//     } catch (cloudinaryError) {
//       console.error('Error deleting files from Cloudinary:', cloudinaryError);
//       // Continue with deletion even if Cloudinary cleanup fails
//     }

//     // Remove from vendor's uploads
//     vendor.uploadedMovies = vendor.uploadedMovies.filter(
//       id => id.toString() !== movie._id.toString()
//     );
//     await vendor.save();

//     // Delete the movie record
//     await Movie.findByIdAndDelete(req.params.id);

//     res.status(200).json({
//       success: true,
//       message: 'Video deleted successfully'
//     });
//   } catch (error) {
//     console.error('Error deleting video:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Server error'
//     });
//   }
// });
// login run successfully 
// router.post('/vendor-login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const vendor = await Vendor.findOne({ email });
//     if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

//     const isMatch = await bcrypt.compare(password, vendor.password);
//     if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

//     res.status(200).json({
//       message: 'Login successful',
//       vendor: {
//         _id: vendor._id,
//         username: vendor.username,
//         email: vendor.email,
//         status: vendor.status
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// });
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

// add the upload video
// Use 'video' and 'thumbnail' as file field names in form-data
router.post(
  '/vendor/upload-video',
  isVendor,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const vendorId = req.vendor._id;

      const {
        title,
        description,
        categories,
        type,
        duration,
        language,
        releaseDate,
        cast
      } = req.body;
     console.log("category"+" "+categories)
      if (!title || !type || !categories|| !req.files.video || !req.files.thumbnail || !language) {
        return res.status(400).json({ message: 'Required fields missing' });
      } 
      console.log(req.files.video);

     
      const videoResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'video', folder: 'vendor_videos' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.files.video[0].buffer); // <-- use buffer
      });
      

      // Upload thumbnail
      const thumbResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'vendor_thumbnails' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.files.thumbnail[0].buffer); // <-- use buffer
      });
      

      // Save to DB
      const parseField = (field) => {
        if (Array.isArray(field)) return field;
        try {
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          return [field]; // fallback to string in array
        }
      };
      
      const parsedCategories = parseField(categories);
      const parsedCast = parseField(cast);
      
      // Then later, when saving to DB:
      const content = new Content({
        title,
        description,
        category: parsedCategories, // ✅ Matches your schema
        type,
        duration,
        language,
        releaseDate,
        thumbnailUrl: thumbResult.secure_url,
        videoUrl: videoResult.secure_url,
        cast: parsedCast,
        uploadedBy: vendorId,
        status: 'pending'
      });

      const savedContent = await content.save();

      await Vendor.findByIdAndUpdate(vendorId, {
        $push: { uploadedContent: savedContent._id }
      });

      res.status(201).json({
        message: 'Video uploaded successfully and pending admin approval',
        content: savedContent
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);
// get all the  videos 
router.get('/videos', async (req, res) => {
  try {
    const videos = await Content.find()
      .populate('category', 'name')             // Populate category names
      .populate('type', 'name')                 // Populate type (Movie, Web Series)
      .populate('language', 'name')             // Populate language (English, Hindi, etc.)
      .populate('cast', 'name image')           // Populate cast names and images
      .populate('uploadedBy', 'name email')     // Vendor info
     
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Fetched all videos successfully',
      videos
    });
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
router.get('/videos/category/:categoryId', async (req, res) => {
  try {
    const videos = await Content.find({ category: req.params.categoryId })
      .populate('category', 'name')
      .populate('type', 'name')
      .populate('language', 'name')
      .populate('cast', 'name image')
      .populate('uploadedBy', 'name email')
      .populate('seasons')
      .sort({ createdAt: -1 });

    res.status(200).json({ message: 'Videos by category fetched successfully', videos });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
router.get('/videos/type/:typeId', async (req, res) => {
  try {
    const videos = await Content.find({ type: req.params.typeId })
      .populate('category', 'name')
      .populate('type', 'name')
      .populate('language', 'name')
      .populate('cast', 'name image')
      .populate('uploadedBy', 'name email')
     
      .sort({ createdAt: -1 });

    res.status(200).json({ message: 'Videos by type fetched successfully', videos });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// router.post(
//   '/vendor/upcoming',
//   isVendor,
//   upload.fields([
//     { name: 'banner', maxCount: 1 },
//     { name: 'trailer', maxCount: 1 }
//   ]),
//   async (req, res) => {
//     try {
//       const vendorId = req.vendor._id;

//       const {
//         title,
//         description,
//         category,
//         type,
//         duration,
//         language,
//         releaseDate,
//         cast
//       } = req.body;

//       // Check required fields
//       if (!title || !type || !category || !language || !req.files || !req.files.banner) {
//         return res.status(400).json({ message: 'Required fields missing' });
//       }

//       // Validate banner MIME type
//       const bannerFile = req.files.banner[0];
//       const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
//       if (!allowedImageTypes.includes(bannerFile.mimetype)) {
//         return res.status(400).json({ message: 'Only image files are allowed for the banner.' });
//       }

//       // Upload banner
//       const bannerResult = await new Promise((resolve, reject) => {
//         const stream = cloudinary.uploader.upload_stream(
//           { resource_type: 'image', folder: 'upcoming_banners' },
//           (error, result) => {
//             if (error) return reject(error);
//             resolve(result);
//           }
//         );
//         stream.end(bannerFile.buffer);
//       });

//       // Upload trailer if provided
//       let trailerResult = null;
//       if (req.files.trailer) {
//         const trailerFile = req.files.trailer[0];
//         const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska'];
//         if (!allowedVideoTypes.includes(trailerFile.mimetype)) {
//           return res.status(400).json({ message: 'Only video files are allowed for the trailer.' });
//         }

//         trailerResult = await new Promise((resolve, reject) => {
//           const stream = cloudinary.uploader.upload_stream(
//             {
//               resource_type: 'video',
//               folder: 'upcoming_trailers',
//               format: 'mp4'
//             },
//             (error, result) => {
//               if (error) return reject(error);
//               resolve(result);
//             }
//           );
//           stream.end(trailerFile.buffer);
//         });
//       }

//       // Parse array fields
//       const parseField = (field) => {
//         if (Array.isArray(field)) return field;
//         try {
//           const parsed = JSON.parse(field);
//           return Array.isArray(parsed) ? parsed : [parsed];
//         } catch (e) {
//           return [field];
//         }
//       };

//       const parsedCategories = parseField(category);
//       const parsedCast = parseField(cast);

//       // Save to DB
//       const upcoming = new UpcomingContent({
//         title,
//         description,
//         category: parsedCategories,
//         type,
//         duration,
//         language,
//         releaseDate,
//         bannerUrl: bannerResult.secure_url,
//         trailerUrl: trailerResult ? trailerResult.secure_url : null,
//         cast: parsedCast,
//         uploadedBy: vendorId
//       });

//       const savedUpcoming = await upcoming.save();

//       await Vendor.findByIdAndUpdate(vendorId, {
//         $push: { uploadedContent: savedUpcoming._id }
//       });

//       res.status(201).json({
//         message: 'Upcoming content uploaded successfully.',
//         upcoming: savedUpcoming
//       });

//     } catch (error) {
//       console.error('Error uploading upcoming content:', error);
//       res.status(500).json({ message: 'Server error.', error: error.message });
//     }
//   }
// );


module.exports = router;

