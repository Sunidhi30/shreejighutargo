const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }],
  releaseYear: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,  // in minutes
    required: true
  },
  ageRating: {
    type: String,
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'Unrated'],
    default: 'Unrated'
  },
  poster: {
    type: String,
    required: true
  },
  trailerUrl: {
    type: String
  },
  mediaFiles: {
    original: {
      url: String,
      size: Number
    },
    qualities: {
      '4k': String,
      '1080p': String,
      '720p': String,
      '480p': String
    }
  },
  cast: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cast' }],

  director: {
    type: String
  },
  language: {
    type: String,
    required: true
  },
  subtitles: [{
    language: String,
    url: String
  }],
  ratings: {
    averageRating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  userReviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  pricing: {
    rentalPrice: {
      type: Number,
      default: 0
    },
    purchasePrice: {
      type: Number,
      default: 0
    },
    isSubscriptionOnly: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminRemarks: {
    type: String
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isTopRated: {
    type: Boolean,
    default: false
  },
  isNewRelease: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add text index for search
movieSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Movie', movieSchema);