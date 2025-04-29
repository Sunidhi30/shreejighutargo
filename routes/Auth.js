const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User'); // adjust path if needed
const jwt = require('jsonwebtoken');
// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // optional: replace with Cloudinary
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });
// POST /api/auth/register
router.post('/register', upload.single('image'), async (req, res) => {
    try {
      const {
        full_name,
        email,
        mobile_number,
        password,
        type, // 1-OTP, 2-Google, 3-Apple, 4-Normal
        device_name,
        device_type,
        device_token,
        device_id,
        role = 'user' // default role is 'user' if not specified
      } = req.body;
  
      if (!email || !password || !full_name) {
        return res.status(400).json({ status: 400, error: 'Required fields missing' });
      }
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ status: 400, error: 'User already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = new User({
        full_name,
        email,
        mobile_number,
        password: hashedPassword,
        type,
        device_name,
        device_type,
        device_token,
        device_id,
        role,
        profile_image: req.file ? req.file.path : null // if using multer (can be cloudinary URL)
      });
  
      await newUser.save();
  
      const token = jwt.sign({ id: newUser._id }, 'Apple', { expiresIn: '7d' });
  
      return res.status(201).json({
        status: 201,
        message: 'Registration successful',
        data: {
          id: newUser._id,
          full_name: newUser.full_name,
          email: newUser.email,
          token
        }
      });
    } catch (err) {
      return res.status(500).json({ status: 500, error: err.message });
    }
}); 
// POST /login
router.post('/login', upload.single('image'), async (req, res) => {
  try {
    const {
      email,
      full_name,
      type,
      device_name,
      device_type,
      device_token,
      device_id
    } = req.body;

    let image = '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`; // or get Cloudinary URL
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        full_name,
        type,
        device_name,
        device_type,
        device_token,
        device_id,
        image
      });
    } else {
      user.full_name = full_name;
      user.type = type;
      user.device_name = device_name;
      user.device_type = device_type;
      user.device_token = device_token;
      user.device_id = device_id;
      if (image) user.image = image;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, 'Apple', { expiresIn: '7d' });

    res.status(200).json({
      status: 200,
      message: 'Login successful',
      data: {
        id: user._id,
        name: user.full_name,
        email: user.email,
        image: user.image,
        token
      }
    });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
});
// POST /api/auth/tv_login
router.post('/tv_login', async (req, res) => {
    try {
      const { user_id, unique_code } = req.body;
  
      if (!unique_code) {
        return res.status(400).json({ status: 400, error: 'Unique code is required' });
      }
  
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({ status: 404, error: 'User not found' });
      }
  
      // Example logic: assume `unique_code` is matched somewhere (you can enhance this)
      user.tv_code = unique_code;
      await user.save();
  
      return res.status(200).json({
        status: 200,
        message: 'TV login successful',
        data: {
          id: user._id,
          mobile_number: user.mobile_number,
          tv_code: unique_code
        }
      });
    } catch (err) {
      return res.status(500).json({ status: 500, error: err.message });
    }
 });
 

module.exports = router;
