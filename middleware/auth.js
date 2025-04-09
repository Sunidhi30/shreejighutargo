



const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure correct path
const Admin = require("../models/Admin");
const Vendor = require("../models/Vendor");
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

