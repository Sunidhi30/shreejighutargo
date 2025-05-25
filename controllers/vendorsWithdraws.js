// Calculate remaining lock days for vendor


const Vendor = require("../models/Vendor")
const WithdrawalRequest = require("../models/VendorWithdrawalRequest")

// Calculate remaining lock days for vendor
const calculateRemainingLockDays = (vendor) => {
    if (!vendor.walletLockEndDate) {
      return 0;
    }
    
    const currentDate = new Date();
    const endDate = new Date(vendor.walletLockEndDate);
    
    // If current date is past end date, no lock remaining
    if (currentDate >= endDate) {
      return 0;
    }
    
    // Calculate remaining days
    const remainingMs = endDate.getTime() - currentDate.getTime();
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    
    return Math.max(0, remainingDays);
  };
  
  // Check if vendor can make withdrawal
  const canVendorWithdraw = (vendor) => {
    if (!vendor.walletLockEndDate) {
      return true; // No lock period set
    }
    
    const currentDate = new Date();
    const endDate = new Date(vendor.walletLockEndDate);
    
    return currentDate >= endDate;
  };
  
  // ============================
  // 3. VENDOR CONTROLLERS
  // ============================
  
  // Create withdrawal request
// Create withdrawal request
const createWithdrawalRequest = async (req, res) => {
    try {
      const vendorId = req.vendor.id; // Assuming authenticated vendor
      const {
        amount,
        bankDetails,
        upiId
      } = req.body;
  
      // Validate required fields
      if (!amount || !bankDetails || !bankDetails.accountName || 
          !bankDetails.accountNumber || !bankDetails.bankName || 
          !bankDetails.ifscCode || !bankDetails.holderName) {
        return res.status(400).json({
          success: false,
          message: 'All bank details are required'
        });
      }
  
      // Get vendor details
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }
  
      // Check if vendor has sufficient balance
      if (vendor.wallet < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance in wallet'
        });
      }
  
      // Calculate remaining lock days
      const remainingDays = calculateRemainingLockDays(vendor);
      const canWithdraw = remainingDays === 0;
  
      // Check if wallet lock period is still active
      if (remainingDays > 0) {
        return res.status(400).json({
          success: false,
          message: `Wallet is locked. Cannot create withdrawal request. ${remainingDays} days remaining until unlock.`,
          data: {
            lockDaysRemaining: remainingDays,
            canWithdraw: false,
            lockEndDate: vendor.walletLockEndDate
          }
        });
      }
  
      // Check for existing pending requests
      const existingRequest = await WithdrawalRequest.findOne({
        vendorId,
        status: 'pending'
      });
  
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending withdrawal request'
        });
      }
  
      // Create withdrawal request
      const withdrawalRequest = new WithdrawalRequest({
        vendorId,
        amount,
        bankDetails,
        upiId,
        lockDaysRemaining: remainingDays,
        canWithdraw
      });
  
      await withdrawalRequest.save();
  
      res.status(201).json({
        success: true,
        message: 'Withdrawal request created successfully',
        data: {
          requestId: withdrawalRequest._id,
          amount,
          lockDaysRemaining: remainingDays,
          canWithdraw,
          status: 'pending'
        }
      });
  
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
  
  
  // Get vendor's withdrawal requests
  const getVendorWithdrawalRequests = async (req, res) => {
    try {
      const vendorId = req.vendor.id;
  
      const requests = await WithdrawalRequest.find({ vendorId })
        .sort({ createdAt: -1 });
  
      const vendor = await Vendor.findById(vendorId);
      const remainingDays = calculateRemainingLockDays(vendor);
  
      res.json({
        success: true,
        data: {
          requests,
          walletBalance: vendor.wallet,
          lockDaysRemaining: remainingDays,
          canWithdraw: remainingDays === 0
        }
      });
  
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
  
  // Get vendor wallet info
 // Get vendor wallet info
const getVendorWalletInfo = async (req, res) => {
    try {
      const vendorId = req.vendor.id;
      const vendor = await Vendor.findById(vendorId);
  
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }
  
      const remainingDays = calculateRemainingLockDays(vendor);
  
      res.json({
        success: true,
        data: {
          walletBalance: vendor.wallet,
          lockedBalance: vendor.lockedBalance,
          lockDaysRemaining: remainingDays,
          canWithdraw: remainingDays === 0,
          lockStartDate: vendor.walletLockStartDate,
          lockEndDate: vendor.walletLockEndDate,
          totalLockDays: vendor.walletLockDays
        }
      });
  
    } catch (error) {
      console.error('Error fetching wallet info:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
  
  module.exports = {

    getVendorWithdrawalRequests,
    getVendorWalletInfo,
    createWithdrawalRequest
  }   