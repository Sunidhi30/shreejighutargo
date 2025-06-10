const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Movie = require("../models/Video")
const Video = require("../models/Video")
const Series = require("../models/Series")
const TvShow = require("../models/TVShow")
const WebSeries = require("../models/Series")
const multer = require('multer');
const DynamicVideo = require('../models/DynamicVideo');
const { uploadToCloudinary } = require('../utils/cloudinary');
const heicConvert = require('heic-convert');
const Type = require("../models/Type")
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
// router.get('/search-allvideos-bytype', async (req, res) => {
//     try {
//       const { type } = req.query;
  
//       if (!type) {
//         return res.status(400).json({
//           success: false,
//           message: 'Type parameter is required (e.g., movie, web_series, tv_show, dynamic)',
//         });
//       }
  
//       let results = [];
  
//       switch (type) {
//         case 'movie':
//           results = await Movie.find().lean();
//           results = results.map(item => ({ ...item, category: 'movie' }));
//           break;
//         case 'web-series':
//           results = await WebSeries.find().lean();
//           results = results.map(item => ({ ...item, category: 'web-series' }));
//           break;
//         case 'show':
//           results = await TvShow.find().lean();
//           results = results.map(item => ({ ...item, category: 'tv_show' }));
//           break;
//         case 'others':
//           results = await DynamicVideo.find().lean();
//           results = results.map(item => ({ ...item, category: 'dynamic' }));
//           break;
//         default:
//           return res.status(400).json({
//             success: false,
//             message: 'Invalid type. Valid types are: movie, web-series, tv_show, dynamic',
//           });
//       }
  
//       return res.status(200).json({
//         success: true,
//         count: results.length,
//         results,
//       });
//     } catch (error) {
//       console.error('Search error:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Server error while fetching videos',
//         error: error.message,
//       });
//     }
//   });
router.get('/search-allvideos-bytype', async (req, res) => {
  try {
    const { type, include_episodes = false, limit = 50, page = 1 } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Type parameter is required (e.g., movie, web-series, show, or any custom type)',
      });
    }

    let results = [];
    let totalCount = 0;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find the type dynamically from Type collection by name only
    const typeDoc = await Type.findOne({ 
      name: { $regex: new RegExp(type, 'i') }, // Case insensitive search by name only
      status: 1 // Only active types
    });

    if (!typeDoc) {
      return res.status(404).json({
        success: false,
        message: `Type '${type}' not found in database`,
      });
    }

    // Base query for approved content only
    const baseQuery = {
      $or: [
        { status: 'approved' },
        { approvalStatus: 'approved' },
        { isApproved: true }
      ]
    };

    // Search query with type_id
    const searchQuery = {
      ...baseQuery,
      type_id: typeDoc._id
    };

    // Search in main Video collection (Movies and other single videos)
    const videoResults = await Video.find(searchQuery)
      .populate('vendor_id', 'name')
      .populate('category_id', 'name')
      .populate('channel_id', 'name')
      .populate('producer_id', 'name')
      .populate('cast_ids', 'name')
      .populate('language_id', 'name')
      .lean()
      .skip(skip)
      .limit(parseInt(limit));

    results = videoResults.map(item => ({
      ...item,
      content_type: 'video',
      category: 'movie' // or determine based on type
    }));

    // Search in Series collection
    const seriesResults = await Series.find(searchQuery)
      .populate('vendor_id', 'name')
      .populate('category_id', 'name')
      .lean()
      .skip(skip)
      .limit(parseInt(limit));

    const seriesWithType = seriesResults.map(item => ({
      ...item,
      content_type: 'series',
      category: 'web-series'
    }));

    results = [...results, ...seriesWithType];

    // Search in TV Shows collection
    const tvShowResults = await TvShow.find(searchQuery)
      .populate('vendor_id', 'name')
      .populate('category_id', 'name')
      .populate('channel_id', 'name')
      .lean()
      .skip(skip)
      .limit(parseInt(limit));

    const tvShowWithType = tvShowResults.map(item => ({
      ...item,
      content_type: 'tv_show',
      category: 'show'
    }));

    results = [...results, ...tvShowWithType];

    // Include episodes if requested
    if (include_episodes === 'true') {
      // Search Series Episodes
      const episodeResults = await Episode.find(searchQuery)
        .populate('series_id', 'title')
        .populate('season_id', 'season_number')
        .populate('vendor_id', 'name')
        .populate('category_id', 'name')
        .lean()
        .skip(skip)
        .limit(parseInt(limit));

      const episodesWithType = episodeResults.map(item => ({
        ...item,
        content_type: 'series_episode',
        category: 'episode',
        parent_title: item.series_id?.title
      }));

      // Search TV Episodes
      const tvEpisodeResults = await TVEpisode.find(searchQuery)
        .populate('show_id', 'title')
        .populate('season_id', 'season_number')
        .populate('vendor_id', 'name')
        .populate('category_id', 'name')
        .lean()
        .skip(skip)
        .limit(parseInt(limit));

      const tvEpisodesWithType = tvEpisodeResults.map(item => ({
        ...item,
        content_type: 'tv_episode',
        category: 'tv_episode',
        parent_title: item.show_id?.title
      }));

      results = [...results, ...episodesWithType, ...tvEpisodesWithType];
    }

    // Get total count for pagination
    const videoCount = await Video.countDocuments(searchQuery);
    const seriesCount = await Series.countDocuments(searchQuery);
    const tvShowCount = await TvShow.countDocuments(searchQuery);
    
    let episodeCount = 0;
    if (include_episodes === 'true') {
      const seriesEpisodeCount = await Episode.countDocuments(searchQuery);
      const tvEpisodeCount = await TVEpisode.countDocuments(searchQuery);
      episodeCount = seriesEpisodeCount + tvEpisodeCount;
    }

    totalCount = videoCount + seriesCount + tvShowCount + episodeCount;

    // Sort results by creation time (newest first)
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      message: `Found content for type: ${typeDoc.name || type}`,
      type_info: {
        id: typeDoc._id,
        name: typeDoc.name,
        type: typeDoc.type
      },
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: totalCount,
        total_pages: Math.ceil(totalCount / parseInt(limit))
      },
      breakdown: {
        videos: videoCount,
        series: seriesCount,
        tv_shows: tvShowCount,
        episodes: episodeCount
      },
      count: results.length,
      results
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
