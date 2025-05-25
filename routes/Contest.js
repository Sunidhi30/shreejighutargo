const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect , verifyAdmin, isVendor , isUser} = require("../middleware/auth");
const {
  createContest,
  getAllContests,
  getContestById,
  updateContest,
  deleteContest,
  registerForContest,
  editParticipantData,
  publishResults,
  getEligibleVideos,
  getContestStats,
  changeContestStatus
} = require('../controllers/contestController');

// Configure multer for banner image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/contests/');
  },
  filename: function (req, file, cb) {
    cb(null, 'contest_' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Middleware (you'll need to implement these based on your auth system)
const adminAuth = (req, res, next) => {
  // Your admin authentication logic here
  // Should set req.admin with admin data
  next();
};

const vendorAuth = (req, res, next) => {
  // Your vendor authentication logic here
  // Should set req.vendor with vendor data
  next();
};

// ============ ADMIN ROUTES ============

// Create a new contest (Admin only)
router.post('/admin/contests', verifyAdmin, upload.single('bannerImage'), createContest);

// Get all contests (Admin)
router.get('/admin/contests',  verifyAdmin, getAllContests);

// Get single contest by ID (Admin)
router.get('/admin/contests/:id', verifyAdmin, getContestById);

// Update contest (Admin only)
router.put('/admin/contests/:id', verifyAdmin, upload.single('bannerImage'), updateContest);

// Delete contest (Admin only)
router.delete('/admin/contests/:id',  verifyAdmin, deleteContest);

// Edit participant data (views, scores, etc.) - Admin only
// This is the KEY ROUTE where admin can edit total views of movies!
router.put('/admin/contests/:contestId/participants/:participantId', verifyAdmin, editParticipantData);

// Publish contest results (Admin only)
router.post('/admin/contests/:contestId/publish-results',  verifyAdmin, publishResults);

// Change contest status (Admin only)
router.patch('/admin/contests/:contestId/status',  verifyAdmin, changeContestStatus);

// Get contest statistics (Admin only)
router.get('/admin/contests/:contestId/stats',  verifyAdmin, getContestStats);

// Get eligible videos for a contest (Admin)
router.get('/admin/contests/:contestId/eligible-videos',  verifyAdmin, getEligibleVideos);

// ============ VENDOR ROUTES ============

// Get all published contests (Vendor can view)
router.get('/vendor/contests', isVendor, (req, res, next) => {
  // Only show published/active contests to vendors
  req.query.status = req.query.status || 'published,registration_open,ongoing';
  next();
}, getAllContests);

// Get single contest details (Vendor can view)
router.get('/vendor/contests/:id', isVendor, getContestById);

// Register for a contest (Vendor)
router.post('/vendor/contests/register', isVendor, registerForContest);

// Get vendor's eligible videos for contest
router.get('/vendor/contests/:contestId/my-videos', isVendor, (req, res, next) => {
  req.query.vendorId = req.vendor._id; // Filter by vendor ID
  next();
}, getEligibleVideos);

// ============ PUBLIC ROUTES ============

// Get public contests (no auth required)
router.get('/public/contests', (req, res, next) => {
  req.query.status = 'published,registration_open,ongoing,completed';
  next();
}, getAllContests);

// Get public contest details
router.get('/public/contests/:id', getContestById);

module.exports = router;

/*
USAGE EXAMPLES:

1. ADMIN CREATE CONTEST:
POST /api/admin/contests
Headers: Authorization: Bearer <admin_token>
Body (form-data):
{
  "title": "Best Short Film Contest 2024",
  "description": "Submit your best short films",
  "contestType": "short_films",
  "type_id": "60f7d5b8e1234567890abcde",
  "startDate": "2024-07-01T00:00:00Z",
  "endDate": "2024-07-31T23:59:59Z",
  "registrationStartDate": "2024-06-01T00:00:00Z",
  "registrationEndDate": "2024-06-30T23:59:59Z",
  "rules": "Contest rules here...",
  "judgingCriteria": "Judging criteria here...",
  "prizes": [{"position": 1, "title": "First Prize", "amount": 10000}],
  "bannerImage": <file>
}

2. ADMIN EDIT PARTICIPANT VIEWS (KEY FUNCTIONALITY):
PUT /api/admin/contests/64f7d5b8e1234567890abcde/participants/64f7d5b8e1234567890abcdf
Headers: Authorization: Bearer <admin_token>
Body:
{
  "contestViews": 15000,  // Admin can edit total views here!
  "judgeScore": 85,
  "status": "approved",
  "rank": 1
}

3. VENDOR REGISTER FOR CONTEST:
POST /api/vendor/contests/register
Headers: Authorization: Bearer <vendor_token>
Body:
{
  "contestId": "64f7d5b8e1234567890abcde",
  "videoId": "64f7d5b8e1234567890abcdf"
}

4. GET CONTEST STATS:
GET /api/admin/contests/64f7d5b8e1234567890abcde/stats
Headers: Authorization: Bearer <admin_token>

5. CHANGE CONTEST STATUS:
PATCH /api/admin/contests/64f7d5b8e1234567890abcde/status
Headers: Authorization: Bearer <admin_token>
Body:
{
  "status": "registration_open"
}
*/