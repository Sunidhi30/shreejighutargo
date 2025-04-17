
const express = require('express');
const jwt = require('jsonwebtoken');
const User  = require("../models/User");
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator');
const sessions = new Map();
const crypto= require("crypto")


function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

env = require('dotenv').config();

const router = express.Router();
const OTPStore = new Map(); // Temporary store for OTPs
const { trusted } = require('mongoose');
// Email transport setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

router.post('/register', async (req, res) => {
  console.log(req.body);
  try {
    const { email, mobileNumber} = req.body;

    // Ensure at least one is provided
    if (!email && !mobileNumber) {
      return res.status(200).json({ success: false, error: 'Either email or mobile number is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(mobileNumber ? [{ mobileNumber }] : [])
      ]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(200).json({ success: false, error: 'Email already registered' });
      }
      if (existingUser.mobileNumber === mobileNumber) {
        return res.status(200).json({ success: false, error: 'Phone number already registered' });
      }
    }

    // Generate OTP (for email or mobile)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    

    const generateReferralCode = async () => {
      let code;
      let isUnique = false;
      while (!isUnique) {
        code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const existingCode = await User.findOne({ referralCode: code });
        if (!existingCode) isUnique = true;
      }
      return code;
    };
    const newReferralCode = await generateReferralCode();
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return res.status(200).json({ success: false, error: 'Invalid referral code' });
      }
    }
    
    const newUser = new User({
      email: email || undefined,
      mobileNumber: mobileNumber || undefined,
      emailOtp: email ? otp : undefined,
      emailOtpExpiry: email ? otpExpiry : undefined,
      phonePin: mobileNumber ? otp : undefined,
      phonePinExpiry: mobileNumber ? otpExpiry : undefined,
      referralCode: newReferralCode,
      referredBy: referrer ? referrer._id : null
    });
    // await newUser.save();

    const sessionId = generateSessionId();
    sessions.set(sessionId, { user : newUser });

    console.log(newUser);


    if (referrer) {
      const referralBonus = referrer.totalInvestment * 0.035; // 3.5% of investment
      referrer.referralEarnings += referralBonus;
      referrer.totalEarnings += referralBonus;
      await referrer.save();
    }
    // Send OTP to email if provided
    if (email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        
        to: email,
        subject: 'Verify your email',
        text: `Your verification code is: ${otp}. It will expire in 10 minutes.`
      });
    }
    
    // const sessionId = generateSessionId();
    // sessions.set(sessionId, { userId: newUser._id });

    // Here you would integrate an SMS API to send the OTP to mobileNumber if provided
    if (mobileNumber) {
      console.log(`Send OTP ${otp} to mobile: ${mobileNumber}`);
      // Example: await smsService.sendOTP(mobileNumber, otp);
    }

    res.status(201).json({
      message: 'User created. Please verify your email or phone number.',
      sessionId,
      success: true,
      nextStep: email ? 'email-verification' : 'phone-verification',
      referralCode: newReferralCode
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(200).json({ success: false, error: 'Server error' });
  }
});


router.post('/verify-otp', async (req, res) => {
  try {
    const { otp, sessionId } = req.body;
    
    if (!otp || !sessionId) {
      return res.status(200).json({success : true , error: 'OTP and session ID required' });
    }
    
    // Validate session
    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(200).json({  success : true , error: 'Invalid or expired session' });
    }
    
    // Get user
    const user =  session.user;
  
    console.log(user);
    if (!user) {
      return res.status(200).json({success : true, error: 'User not found' });
    }

    
    // Check if OTP is correct and not expired
    if (user.emailOtp !== otp) {
      return res.status(200).json({ success : true, error: 'Invalid OTP' });
    }
    
    if (!user.emailOtpExpiry || new Date() > user.emailOtpExpiry) {
      return res.status(200).json({ success : true , error: 'OTP expired' });
    }
    
    // Mark email as verified
    user.isEmailVerified = true;
    
    await user.save();
    //done 
    
    res.json({ 
      success: true,
      message: 'Email verified successfully. You can now proceed with the next step.',
      nextStep: 'complete-registration' 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success : false, error: 'Server error' });
  }
});


router.post('/verify-otp', async (req, res) => {
  try {
    const { otp, sessionId } = req.body;
    
    if (!otp || !sessionId) {
      return res.status(400).json({ success: false, error: 'OTP and session ID required' });
    }
    
    // Validate session
    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session' });
    }
    
    // Get user
    const user = await User.findById(session.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Check if OTP is correct and not expired
    if (user.emailOtp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });

    }
    
    if (!user.emailOtpExpiry || new Date() > user.emailOtpExpiry) {
      return res.status(400).json({ success: false, error: 'OTP expired' });
    }
    
    // Mark email as verified
    user.isEmailVerified = true;
    
    await user.save();
    
    res.json({ 
      success: true,
      message: 'Email verified successfully. You can now proceed with the next step.',
      nextStep: 'complete-registration' 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// 3️⃣ **Login API (Using Email or Mobile Number & OTP)**
router.post('/login', [
  // check('login', 'Email or Mobile Number is required').not().isEmpty()
], async (req, res) => {
  const { email} = req.body;
  console.log("Searching for user with:", email);
  // yeh hi email : undefined ara h 
  try {
      let user = await User.findOne({
            email: email 
      });

      if (!user)       return res.status(200).json({ success: false, msg: 'User not found. Please register first.' });

      
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      OTPStore.set(user.email, otp); // Store OTP temporarily noo

      // Send OTP to email
      await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Login OTP Verification',
          text: `Your OTP code is ${otp}. It will expire in 5 minutes.`
      });

      return res.json({ success: true, msg: 'OTP sent to email. Please verify.', email: user.email });
    } catch (err) {
      console.error(err);
      // res.status(500).json({ msg: 'Server error' });
      return res.status(500).json({ success: false, msg: 'Server error' });

  }
});

// 4️⃣ **Verify OTP & Login**
router.post('/verify-login-otp', [
  // check('email', 'Email is required').isEmail(),
  check('otp', 'OTP is required').not().isEmpty()
], async (req, res) => {
  const { email, otp } = req.body;

  if (!OTPStore.has(email) || OTPStore.get(email) !== otp) {
    return res.status(400).json({ success: false, msg: 'Invalid or expired OTP' });
  }

  OTPStore.delete(email); // Remove OTP after verification

  try {
      let user = await User.findOne({ email });
      if (!user)       return res.status(400).json({ success: false, msg: 'User not found.' });


      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ success: true, msg: 'Login successful', token, user });
  } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, msg: 'Server error' });
    }
});
module.exports = router;
