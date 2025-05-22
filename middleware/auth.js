
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure correct path
const Admin = require("../models/Admin");
const Vendor = require("../models/Vendor");
const LockPeriod = require("../models/LockPeriod")
require('dotenv').config();
// exports.isVendor = async (req, res, next) => {
//     try {
//       const token = req.header('Authorization')?.split(' ')[1];
      
//       if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await Vendor.findById(decoded.id);
//       console.log(user);
//       if (!user) return res.status(403).json({ error: 'Only vendors can upload movies.' });
  
//       req.user = user;
//       next();
//     } catch (error) {
//       res.status(401).json({ error: 'Invalid token.' });
//     }
//   };
exports.isUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded:", decoded);

    const user = await User.findById(decoded.userID); // ✅ Now it will work

    console.log("User:", user);

    if (!user || user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can access this route.' });
    }

    req.user = user; // ✅ Set the authenticated user to req.user
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
};
exports.isVendor = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded:", decoded);

    const vendor = await Vendor.findById(decoded.vendorId); // ✅ Fixed
    console.log("Vendor:", vendor);

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(403).json({ message: 'Only vendors can upload content' });
    }

    req.vendor = vendor;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
};
exports. checkVendorLock = async (req, res, next) => {
  try {
    const vendorId = req.vendor.id; // from auth middleware

    // Find active lock period for this vendor
    const activeLock = await LockPeriod.findOne({
      vendor: vendorId,
      status: 'locked'
    });

    if (!activeLock) {
      return next(); // No lock, proceed
    }

    // Calculate if lock period has expired
    const unlocksAt = new Date(activeLock.lockedAt.getTime() + (activeLock.durationDays * 24 * 60 * 60 * 1000));
    const now = new Date();

    if (now >= unlocksAt) {
      // Lock period has expired, automatically unlock
      activeLock.status = 'unlocked';
      await activeLock.save();

      // Move ALL locked balance back to wallet (including new earnings during lock period)
      const vendor = await Vendor.findById(vendorId);
      vendor.wallet += vendor.lockedBalance;
      vendor.lockedBalance = 0;
      await vendor.save();

      return next(); // Lock expired, proceed
    }

    // Vendor is still locked - move any new earnings to locked balance
    const vendor = await Vendor.findById(vendorId);
    if (vendor.wallet > 0) {
      vendor.lockedBalance += vendor.wallet;
      vendor.wallet = 0;
      await vendor.save();
    }

    // Vendor is still locked
    const remainingDays = Math.ceil((unlocksAt - now) / (24 * 60 * 60 * 1000));
    
    return res.status(403).json({
      success: false,
      message: 'Account is temporarily locked from transactions. All earnings are locked during this period.',
      lockDetails: {
        lockedAt: activeLock.lockedAt,
        durationDays: activeLock.durationDays,
        unlocksAt: unlocksAt,
        remainingDays: remainingDays,
        totalLockedAmount: vendor.lockedBalance
      }
    });

  } catch (error) {
    console.error('Error checking vendor lock:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking account status'
    });
  }
};

/**
 * 🔹 Middleware to verify JWT authentication
 */
exports.protect = async (req, res, next) => {
    let token;

    // Check if token is provided in the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Access Denied. No Token Provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded)
     
        // ✅ Update the email to match your hardcoded admin email
        if (decoded.role === 'admin' && decoded.email === 'sunidhi@gmail.com') {
            req.user = { role: 'admin', email: 'sunidhi@gmail.com' };
            return next();
        }
        // agr database mai set krege toh vo kaise krege 

        req.user = await User.findById(decoded.userId);
        console.log("Decoded User:", req.user); // ✅ Debugging log
//han
        if (!req.user) {
            return res.status(401).json({ msg: "User not found" });
        }
        next();
      


    } catch (error) {
        res.status(401).json({ message: 'Invalid Token' });
    }
};

/**
 * 🔹 Middleware to restrict access to admin-only routes
 */
exports.adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access only' });
    }
    next();
};
exports.verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};




exports.verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token required' });

  try {
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
};

