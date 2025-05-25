const Contest = require('../models/Contest');
const Video = require('../models/Video'); // Using your existing Video schema
const Vendor = require('../models/Vendor'); // Using your existing Vendor schema
const Admin = require('../models/Admin'); // Using your existing Admin schema
const Type = require('../models/Type');
const mongoose = require('mongoose');

// Create a new contest (Admin only)
const createContest = async (req, res) => {
  try {
    const {
      title,
      description,
      contestType,
      type_id,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      rules,
      judgingCriteria,
      prizes
    } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const regStart = new Date(registrationStartDate);
    const regEnd = new Date(registrationEndDate);

    if (regStart >= regEnd) {
      return res.status(400).json({
        success: false,
        message: 'Registration start date must be before end date'
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Contest start date must be before end date'
      });
    }

    if (regEnd > start) {
      return res.status(400).json({
        success: false,
        message: 'Registration must end before contest starts'
      });
    }

    const contest = new Contest({
      title,
      description,
      contestType,
      type_id,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      rules,
      judgingCriteria,
      prizes: prizes || [],
      createdBy: req.admin._id, // Using your admin ID
      bannerImage: req.file ? req.file.filename : req.body.bannerImage
        });

    await contest.save();

    res.status(201).json({
      success: true,
      message: 'Contest created successfully',
      data: contest
    });

  } catch (error) {
    console.error('Error creating contest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contest',
      error: error.message
    });
  }
};

// Get all contests with filtering
const getAllContests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      contestType,
      search
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (contestType) filter.contestType = contestType;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const contests = await Contest.find(filter)
      .populate('type_id')
      .populate('createdBy', 'email')
      .populate('participants.video_id', 'name thumbnail total_view')
      .populate('participants.vendor_id', 'username fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contest.countDocuments(filter);

    res.json({
      success: true,
      data: contests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching contests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contests',
      error: error.message
    });
  }
};

// Get single contest by ID
const getContestById = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('type_id')
      .populate('createdBy', 'email')
      .populate('participants.video_id', 'name thumbnail description total_view')
      .populate('participants.vendor_id', 'username fullName email');

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    res.json({
      success: true,
      data: contest
    });

  } catch (error) {
    console.error('Error fetching contest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contest',
      error: error.message
    });
  }
};

// Update contest (Admin only)
const updateContest = async (req, res) => {
  try {
    const contestId = req.params.id;
    const updateData = req.body;

    // If banner image is uploaded, add it to update data
    if (req.file) {
      updateData.bannerImage = req.file.filename;
    }

    const contest = await Contest.findByIdAndUpdate(
      contestId,
      updateData,
      { new: true, runValidators: true }
    ).populate('type_id')
     .populate('createdBy', 'email');

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    res.json({
      success: true,
      message: 'Contest updated successfully',
      data: contest
    });

  } catch (error) {
    console.error('Error updating contest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contest',
      error: error.message
    });
  }
};

// Delete contest (Admin only)
const deleteContest = async (req, res) => {
  try {
    const contest = await Contest.findByIdAndDelete(req.params.id);

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    res.json({
      success: true,
      message: 'Contest deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting contest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contest',
      error: error.message
    });
  }
};

// Register a video for contest (Vendor)
const registerForContest = async (req, res) => {
  try {
    const { contestId, videoId } = req.body;
    const vendorId = req.vendor._id; // Using your vendor ID

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    // Check if registration is open
    const now = new Date();
    if (now < contest.registrationStartDate || now > contest.registrationEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Contest registration is not open'
      });
    }
    

    // Check if video exists and belongs to vendor
    const video = await Video.findById(videoId);
    console.log("video his ", video);
    if (!video || video.vendor_id.toString() !== vendorId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Video not found or does not belong to you'
      });
    }
    console.log("contest"+" "+contest.type_id.toString())
    console.log("video"+" "+video.type_id.toString())
    // Check if video type matches contest type
    if (video.type_id.toString() !== contest.type_id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Video type does not match contest requirements'
      });
    }

    // Check if already registered
    const existingRegistration = contest.participants.find(
      p => p.video_id.toString() === videoId
    );
   

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Video is already registered for this contest'
      });
    }

    // Add participant
    contest.participants.push({
      video_id: videoId,
      vendor_id: vendorId,
      contestViews: video.total_view || 0
    });

    contest.totalParticipants = contest.participants.length;
    await contest.save();

    res.json({
      success: true,
      message: 'Successfully registered for contest',
      data: contest
    });

  } catch (error) {
    console.error('Error registering for contest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for contest',
      error: error.message
    });
  }
};

// Admin: Edit participant views and scores
const editParticipantData = async (req, res) => {
  try {
    const { contestId, participantId } = req.params;
    const { contestViews, judgeScore, status, rank } = req.body;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    const participant = contest.participants.id(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Update participant data - This is where admin can edit views!
    if (contestViews !== undefined) participant.contestViews = contestViews;
    if (judgeScore !== undefined) participant.judgeScore = judgeScore;
    if (status !== undefined) participant.status = status;
    if (rank !== undefined) participant.rank = rank;

    await contest.save();

    res.json({
      success: true,
      message: 'Participant data updated successfully',
      data: participant
    });

  } catch (error) {
    console.error('Error updating participant data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update participant data',
      error: error.message
    });
  }
};

// Admin: Publish contest results
const publishResults = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { winners } = req.body;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    // Update contest results
    contest.results.published = true;
    contest.results.publishedDate = new Date();
    contest.results.winners = winners;
    contest.status = 'completed';

    // Update participant prizes
    winners.forEach(winner => {
      const participant = contest.participants.find(
        p => p.video_id.toString() === winner.video_id.toString()
      );
      if (participant) {
        participant.prizeWon = {
          position: winner.position,
          title: winner.prize.title,
          amount: winner.prize.amount
        };
        participant.rank = winner.position;
      }
    });

    await contest.save();

    res.json({
      success: true,
      message: 'Contest results published successfully',
      data: contest
    });

  } catch (error) {
    console.error('Error publishing results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish results',
      error: error.message
    });
  }
};

// Get eligible videos for a contest (based on type)
const getEligibleVideos = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { vendorId } = req.query;

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    const filter = {
      type_id: contest.type_id,
      status: 'approved' // Using your video status field
    };

    if (vendorId) {
      filter.vendor_id = vendorId;
    }
    const videos = await Video.find(filter)
      .populate('vendor_id', 'username fullName')
      .populate('type_id')
      .select('name thumbnail description total_view vendor_id type_id');

    res.json({
      success: true,
      data: videos
    });

  } catch (error) {
    console.error('Error fetching eligible videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch eligible videos',
      error: error.message
    });
  }
};

// Get contest statistics
const getContestStats = async (req, res) => {
  try {
    const { contestId } = req.params;

    const contest = await Contest.findById(contestId)
      .populate('participants.video_id', 'total_view')
      .populate('participants.vendor_id', 'username');

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    const stats = {
      totalParticipants: contest.participants.length,
      totalViews: contest.participants.reduce((sum, p) => sum + (p.contestViews || 0), 0),
      approvedParticipants: contest.participants.filter(p => p.status === 'approved').length,
      pendingParticipants: contest.participants.filter(p => p.status === 'registered').length,
      rejectedParticipants: contest.participants.filter(p => p.status === 'rejected').length,
      averageScore: contest.participants.length > 0 
        ? contest.participants.reduce((sum, p) => sum + (p.judgeScore || 0), 0) / contest.participants.length 
        : 0,
      topVideos: contest.participants
        .sort((a, b) => (b.contestViews || 0) - (a.contestViews || 0))
        .slice(0, 5)
        .map(p => ({
          video_id: p.video_id,
          vendor_id: p.vendor_id,
          views: p.contestViews,
          score: p.judgeScore
        }))
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching contest stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contest statistics',
      error: error.message
    });
  }
};

// Change contest status
const changeContestStatus = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'published', 'registration_open', 'registration_closed', 'ongoing', 'judging', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const contest = await Contest.findByIdAndUpdate(
      contestId,
      { status },
      { new: true }
    );

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    res.json({
      success: true,
      message: 'Contest status updated successfully',
      data: contest
    });

  } catch (error) {
    console.error('Error changing contest status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change contest status',
      error: error.message
    });
  }
};

module.exports = {
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
};