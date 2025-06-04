const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Movie = require("../models/Video")
const TvShow = require("../models/TVShow")
const WebSeries = require("../models/Series")
const multer = require('multer');
const DynamicVideo = require('../models/DynamicVideo');
const { uploadToCloudinary } = require('../utils/cloudinary');
const heicConvert = require('heic-convert');

// Memory storage for multer (to get file buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload fields
const uploadFields = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'landscape', maxCount: 1 },
  { name: 'video_320', maxCount: 1 },
  { name: 'video_480', maxCount: 1 },
  { name: 'video_720', maxCount: 1 },
  { name: 'video_1080', maxCount: 1 },
  { name: 'trailer', maxCount: 1 }
]);

// File upload helper
const uploadFile = async (req, field, folder) => {
  try {
    if (req.files && req.files[field] && req.files[field][0]) {
      const file = req.files[field][0];
      let buffer = file.buffer;
      let mimetype = file.mimetype;

      // HEIC/HEIF conversion
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
  } catch (error) {
    console.error(`Upload error for ${field}:`, error);
    throw error;
  }
};

// Route to create dynamic video
router.post('/upload-dynamic-video', uploadFields, async (req, res) => {
  try {
    const { name, type, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Name and type are required' });
    }

    // Upload files
    const thumbnail = await uploadFile(req, 'thumbnail', 'dynamic/thumbnails');
    const landscape = await uploadFile(req, 'landscape', 'dynamic/landscapes');
    const video_320 = await uploadFile(req, 'video_320', 'dynamic/320');
    const video_480 = await uploadFile(req, 'video_480', 'dynamic/480');
    const video_720 = await uploadFile(req, 'video_720', 'dynamic/720');
    const video_1080 = await uploadFile(req, 'video_1080', 'dynamic/1080');
    const trailer = await uploadFile(req, 'trailer', 'dynamic/trailers');

    const newDynamicVideo = new DynamicVideo({
      name,
      type,
      description: description || '',
      thumbnail,
      landscape,
      video_320,
      video_480,
      video_720,
      video_1080,
      trailer,
      extra: {} // You can customize this to accept extra fields
    });

    await newDynamicVideo.save();
         console.log(newDynamicVideo)
    res.status(201).json({
      success: true,
      message: 'Dynamic video uploaded successfully',
      video: newDynamicVideo
    });

  } catch (err) {
    console.error('Dynamic video upload error:', err);
    res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
});
router.get('/search-allvideos', async (req, res) => {
    try {
      const query = req.query.query;
  
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter is required'
        });
      }
  
      // Create case-insensitive regex for searching
      const searchRegex = new RegExp(query, 'i');
  
      // Define the search filter for collections that have 'type'
      const searchFilterWithType = {
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { type: searchRegex } // For collections that have a type field
        ]
      };
  
      // For collections without a 'type' field, exclude that condition
      const searchFilterWithoutType = {
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      };
  
      // Run all queries in parallel
      const [movies, tvShows, webSeries, dynamicVideos] = await Promise.all([
        Movie.find(searchFilterWithType).lean(),
        TvShow.find(searchFilterWithType).lean(),
        WebSeries.find(searchFilterWithType).lean(),
        DynamicVideo.find(searchFilterWithoutType).lean()
      ]);
  
      // Add a 'category' field to distinguish in response
      const moviesWithCategory = movies.map(video => ({ ...video, category: 'movie' }));
      const tvShowsWithCategory = tvShows.map(video => ({ ...video, category: 'tv_show' }));
      const webSeriesWithCategory = webSeries.map(video => ({ ...video, category: 'web_series' }));
      const dynamicVideosWithCategory = dynamicVideos.map(video => ({ ...video, category: 'dynamic' }));
  
      // Combine all results
      const allResults = [
        ...moviesWithCategory,
        ...tvShowsWithCategory,
        ...webSeriesWithCategory,
        ...dynamicVideosWithCategory
      ];
  
      return res.status(200).json({
        success: true,
        count: allResults.length,
        results: allResults
      });
  
    } catch (error) {
      console.error('Search API error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while searching videos',
        error: error.message
      });
    }
  });
// GET /search-allvideos?type=movie
router.get('/search-allvideos-bytype', async (req, res) => {
    try {
      const { type } = req.query;
  
      if (!type) {
        return res.status(400).json({
          success: false,
          message: 'Type parameter is required (e.g., movie, web_series, tv_show, dynamic)',
        });
      }
  
      let results = [];
  
      switch (type) {
        case 'movie':
          results = await Movie.find().lean();
          results = results.map(item => ({ ...item, category: 'movie' }));
          break;
        case 'web-series':
          results = await WebSeries.find().lean();
          results = results.map(item => ({ ...item, category: 'web-series' }));
          break;
        case 'show':
          results = await TvShow.find().lean();
          results = results.map(item => ({ ...item, category: 'tv_show' }));
          break;
        case 'others':
          results = await DynamicVideo.find().lean();
          results = results.map(item => ({ ...item, category: 'dynamic' }));
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid type. Valid types are: movie, web-series, tv_show, dynamic',
          });
      }
  
      return res.status(200).json({
        success: true,
        count: results.length,
        results,
      });
    } catch (error) {
      console.error('Search error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching videos',
        error: error.message,
      });
    }
  });
module.exports = router;
