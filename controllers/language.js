// controllers/contentController.js
const Video = require('../models/Video');
const Series = require('../models/Series');
const TVShow = require('../models/TVShow');
const Language = require('../models/Language');

exports.getContentByLanguage = async (req, res) => {
    try {
      const { languageId } = req.params;
      const { type } = req.query;
  
      // Base query object
      let query = {};
  
      // Add language filter only if languageId is provided and not 'all'
      if (languageId && languageId !== 'all') {
        query.language_id = languageId;
      }
  
      // Content type mapping
      const contentTypeMapping = {
        'movie': 'movie',
        'series': 'series', 
        'tvshow': 'tvshow',
        'show': 'show',
        'others': 'others'
      };
  
      let fetchPromises = [];
      let shouldFetchSpecificType = type && contentTypeMapping[type.toLowerCase()];
  
      if (shouldFetchSpecificType) {
        // If specific type is requested, fetch only that type
        const requestedType = contentTypeMapping[type.toLowerCase()];
        
        if (requestedType === 'movie') {
          fetchPromises.push(
            Video.find({ ...query, video_type: 'movie' })
              .populate('language_id', 'name')
              .populate('category_id', 'name')
              .select('title name thumbnail language_id category_id video_type')
              .lean()
          );
        } else if (requestedType === 'series') {
          fetchPromises.push(
            Series.find(query)
              .populate('language_id', 'name')
              .populate('category_id', 'name')
              .select('title thumbnail language_id category_id video_type')
              .lean()
          );
        } else if (requestedType === 'tvshow' || requestedType === 'show') {
          fetchPromises.push(
            Video.find({ ...query, video_type: 'tvshow' })
              .populate('language_id', 'name')
              .populate('category_id', 'name')
              .select('title name thumbnail language_id category_id video_type')
              .lean()
          );
        }
      } else {
        // If no specific type requested, fetch all types
        fetchPromises = [
          // Fetch Movies
          Video.find({ ...query, video_type: 'movie' })
            .populate('language_id', 'name')
            .populate('category_id', 'name')
            .select('title name thumbnail language_id category_id video_type')
            .lean(),
          
          // Fetch Series
          Series.find(query)
            .populate('language_id', 'name')
            .populate('category_id', 'name')
            .select('title thumbnail language_id category_id video_type')
            .lean(),
          
          // Fetch TV Shows
          Video.find({ ...query, video_type: 'tvshow' })
            .populate('language_id', 'name')
            .populate('category_id', 'name')
            .select('title name thumbnail language_id category_id video_type')
            .lean(),
          
          // Fetch other video types if needed
          Video.find({ ...query, video_type: { $in: ['show', 'others'] } })
            .populate('language_id', 'name')
            .populate('category_id', 'name')
            .select('title name thumbnail language_id category_id video_type')
            .lean()
        ];
      }
  
      // Execute all queries in parallel
      const results = await Promise.all(fetchPromises);
  
      let allContent = [];
  
      if (shouldFetchSpecificType) {
        // For specific type requests, results[0] contains the data
        const requestedType = contentTypeMapping[type.toLowerCase()];
        allContent = results[0].map(item => ({
          ...item,
          contentType: requestedType,
          displayTitle: item.title || item.name || 'Untitled'
        }));
      } else {
        // For all content requests, combine results from all collections
        const [movies, series, tvShows, others] = results;
        
        allContent = [
          ...movies.map(item => ({ 
            ...item, 
            contentType: 'movie',
            displayTitle: item.title || item.name || 'Untitled'
          })),
          ...series.map(item => ({ 
            ...item, 
            contentType: 'series',
            displayTitle: item.title || 'Untitled'
          })),
          ...tvShows.map(item => ({ 
            ...item, 
            contentType: 'tvshow',
            displayTitle: item.title || item.name || 'Untitled'
          })),
          ...others.map(item => ({ 
            ...item, 
            contentType: item.video_type || 'others',
            displayTitle: item.title || item.name || 'Untitled'
          }))
        ];
      }
  
      // Return error if no content found
      if (!allContent.length) {
        return res.status(404).json({
          success: false,
          message: languageId && languageId !== 'all'
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
        }, {}),
        totalItems: language.content.length
      }));
  
      // Calculate summary statistics
      const summary = allContent.reduce((acc, item) => {
        switch(item.contentType) {
          case 'movie':
            acc.totalMovies++;
            break;
          case 'series':
            acc.totalSeries++;
            break;
          case 'tvshow':
            acc.totalTvShows++;
            break;
          default:
            acc.totalOthers++;
        }
        return acc;
      }, {
        totalMovies: 0,
        totalSeries: 0,
        totalTvShows: 0,
        totalOthers: 0
      });
  
      return res.status(200).json({
        success: true,
        data: {
          totalContent: allContent.length,
          languageGroups: groupedContent,
          summary: summary,
          filters: {
            languageId: languageId || 'all',
            type: type || 'all'
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