// controllers/contentController.js
const Video = require('../models/Video');
const Series = require('../models/Series');
const TVShow = require('../models/TVShow');
const Language = require('../models/Language');

// // Get content by language
// exports.getContentByLanguage = async (req, res) => {
//   try {
//     const { languageId } = req.params;
//     const { type } = req.query; // Optional type filter

//     // Verify if language exists
//     const language = await Language.findById(languageId);
//     if (!language) {
//       return res.status(404).json({
//         success: false,
//         message: 'Language not found'
//       });
//     }

//     // Content type mapping
//     const contentTypeMapping = {
//       'movie': { model: Video, type: 'movie' },
//       'series': { model: Series, type: 'series' },
//       'tvshow': { model: TVShow, type: 'tvshow' }
//     };

//     // Base query
//     let query = { language_id: languageId };

//     // If type is specified, validate and filter
//     if (type) {
//       const mappedType = contentTypeMapping[type.toLowerCase()];
//       if (!mappedType) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid content type. Supported types: movie, series, tvshow'
//         });
//       }
//       query.video_type = mappedType.type;
//     }

//     // Fetch content based on query
//     const [movies, series, tvShows] = await Promise.all([
//         Video.find({ ...query, video_type: 'movie' })
//         .populate('language_id', 'name')
//         .populate('category_id', 'name')
//         .select('title thumbnail language_id category_id') // include needed fields
//         .lean(),
      
//         Series.find({ ...query, video_type: 'series' })
//         .populate('language_id', 'name')
//         .populate('category_id', 'name')
//         .select('title thumbnail language_id category_id') // include needed fields
//         .lean(),
      
//         TVShow.find({ ...query, video_type: 'tvshow' })
//         .populate('language_id', 'name')
//         .populate('category_id', 'name')
//         .select('title thumbnail language_id category_id') // include needed fields
//         .lean()
//     ]);

//     // Combine and format results
//     const allContent = [
//       ...movies.map(item => ({ ...item, contentType: 'movie' })),
//       ...series.map(item => ({ ...item, contentType: 'series' })),
//       ...tvShows.map(item => ({ ...item, contentType: 'tvshow' }))
//     ];

//     // Return error if no content found
//     if (!allContent.length) {
//       return res.status(404).json({
//         success: false,
//         message: type 
//           ? `No ${type} content found for this language`
//           : 'No content found for this language'
//       });
//     }

//     // Group content by type
//     const groupedContent = allContent.reduce((acc, item) => {
//       const type = item.contentType;
//       if (!acc[type]) acc[type] = [];
//       acc[type].push(item);
//       return acc;
//     }, {});

//     return res.status(200).json({
//       success: true,
//       data: {
//         language: language.name,
//         totalContent: allContent.length,
//         byType: groupedContent,
//         allContent: allContent
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching content by language:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

// // Search content
// exports.searchContent = async (req, res) => {
//   try {
//     const { query, languageId } = req.query;
    
//     if (!query) {
//       return res.status(400).json({
//         success: false,
//         message: 'Search query is required'
//       });
//     }

//     const searchRegex = new RegExp(query, 'i');
//     const baseQuery = languageId ? { language_id: languageId } : {};

//     // Search across all content types
//     const [movies, series, tvShows] = await Promise.all([
//       Video.find({
//         ...baseQuery,
//         $or: [
//           { title: { $regex: searchRegex } },
//           { description: { $regex: searchRegex } }
//         ],
//         video_type: 'movie'
//       })
//         .populate('language_id', 'name')
//         .populate('category_id', 'name')
//         .select('-createdAt -updatedAt -__v')
//         .lean(),

//       Series.find({
//         ...baseQuery,
//         $or: [
//           { title: { $regex: searchRegex } },
//           { description: { $regex: searchRegex } }
//         ],
//         video_type: 'series'
//       })
//         .populate('language_id', 'name')
//         .populate('category_id', 'name')
//         .select('-createdAt -updatedAt -__v')
//         .lean(),

//       TVShow.find({
//         ...baseQuery,
//         $or: [
//           { title: { $regex: searchRegex } },
//           { description: { $regex: searchRegex } }
//         ],
//         video_type: 'tvshow'
//       })
//         .populate('language_id', 'name')
//         .populate('category_id', 'name')
//         .select('-createdAt -updatedAt -__v')
//         .lean()
//     ]);

//     // Combine and format results
//     const allResults = [
//       ...movies.map(item => ({ ...item, contentType: 'movie' })),
//       ...series.map(item => ({ ...item, contentType: 'series' })),
//       ...tvShows.map(item => ({ ...item, contentType: 'tvshow' }))
//     ];

//     // Group results by content type
//     const groupedResults = allResults.reduce((acc, item) => {
//       const type = item.contentType;
//       if (!acc[type]) acc[type] = [];
//       acc[type].push(item);
//       return acc;
//     }, {});

//     return res.status(200).json({
//       success: true,
//       data: {
//         totalResults: allResults.length,
//         byType: groupedResults,
//         allResults: allResults
//       }
//     });

//   } catch (error) {
//     console.error('Error searching content:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };
// controllers/contentController.js


exports.getContentByLanguage = async (req, res) => {
  try {
    const { languageId } = req.params;
    const { type } = req.query;

    // Base query object
    let query = {};

    // Add language filter only if languageId is provided
    if (languageId && languageId !== 'all') {
      query.language_id = languageId;
    }

    // Content type mapping
    const contentTypeMapping = {
      'movie': { type: 'movie' },
      'series': { type: 'series' },
      'tvshow': { type: 'tvshow' },
      'show': { type: 'show' },
      'others': { type: 'others' }
    };

    // Add type filter if specified
    if (type && contentTypeMapping[type.toLowerCase()]) {
      query.video_type = contentTypeMapping[type.toLowerCase()].type;
    }

    // Fetch content from all collections in parallel
    const [movies, series, tvShows] = await Promise.all([
        Video.find({ ...query, video_type: 'movie' })
          .populate('language_id', 'name')
          .populate('category_id', 'name')
          .select('title thumbnail language_id category_id') // include needed fields
          .lean(),
      
        Series.find({ ...query, video_type: 'series' })
          .populate('language_id', 'name')
          .populate('category_id', 'name')
          .select('title thumbnail language_id category_id') // include needed fields
          .lean(),
      
        TVShow.find({ ...query, video_type: 'tvshow' })
          .populate('language_id', 'name')
          .populate('category_id', 'name')
          .select('title thumbnail language_id category_id') // include needed fields
          .lean()
      ]);
      

    // Combine and format results
    const allContent = [
      ...movies.map(item => ({ ...item, contentType: 'movie' })),
      ...series.map(item => ({ ...item, contentType: 'series' })),
      ...tvShows.map(item => ({ ...item, contentType: 'tvshow' }))
    ];

    // Return error if no content found
    if (!allContent.length) {
      return res.status(404).json({
        success: false,
        message: languageId 
          ? `No content found for the specified language${type ? ` and type ${type}` : ''}`
          : `No content found${type ? ` for type ${type}` : ''}`
      });
    }

    // Group content by language
    const groupedByLanguage = allContent.reduce((acc, item) => {
      const languageName = item.language_id?.name || 'Unknown';
      if (!acc[languageName]) {
        acc[languageName] = {
          language: languageName,
          content: []
        };
      }
      acc[languageName].content.push(item);
      return acc;
    }, {});

    // Group content by type within each language
    const groupedContent = Object.values(groupedByLanguage).map(language => ({
      language: language.language,
      types: language.content.reduce((acc, item) => {
        if (!acc[item.contentType]) {
          acc[item.contentType] = [];
        }
        acc[item.contentType].push(item);
        return acc;
      }, {})
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalContent: allContent.length,
        languageGroups: groupedContent,
        summary: {
          totalMovies: movies.length,
          totalSeries: series.length,
          totalTvShows: tvShows.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching content:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
