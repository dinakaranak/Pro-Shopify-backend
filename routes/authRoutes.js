const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OtpToken = require('../models/OtpToken');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorHandler').ErrorResponse;
const nodemailer = require('nodemailer');
const { protect ,requireRole} = require('../middlewares/authMiddleware');
const Order = require('../models/Order');

// ✅ Send email helper (now supports HTML)
const sendEmail = async (to, subject, text, html) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `<${process.env.MAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};
// Generate random 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Signup Route
router.post('/signup', asyncHandler(async (req, res, next) => {
  const { email, password, name } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already in use', 400));
  }

  const user = await User.create({ email, password, name });

  const otp = generateOtp();
  const expiry = new Date(Date.now() + 1 * 60 * 1000); // 10 min

  await OtpToken.create({ userId: user._id, otp, expiresAt: expiry });

    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2 style="color: #333;">Verify your email</h2>
      <p>Hello ${name},</p>
      <p>Thank you for signing up. Please use the following OTP to verify your email:</p>
      <div style="font-size: 24px; font-weight: bold; background: #f0f0f0; padding: 10px; display: inline-block; margin: 10px 0;">
        ${otp}
      </div>
      <p>This OTP is valid for 1 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <br/>
      <p>– Adventre Technology solutions pvt.ltd</p>
    </div>
  `;

  await sendEmail(email, 'Verify your email', `Your OTP is: ${otp}`,html);

  res.status(201).json({ success: true, message: 'OTP sent to your email.' });
}));

// Verify Email Route
router.post('/verify-email', asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) return next(new ErrorResponse('User not found', 404));

  const tokenDoc = await OtpToken.findOne({
    userId: user._id,
    otp,
    expiresAt: { $gt: new Date() }
  });

  if (!tokenDoc) return next(new ErrorResponse('Invalid or expired OTP', 400));

  user.isVerified = true;
  await user.save();
  await OtpToken.deleteMany({ userId: user._id }); // clean up

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });

  res.status(200).json({ success: true, message: 'Email verified', token });
}));

// Login Route
router.post('/login', asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new ErrorResponse('Invalid credentials', 401));

  if (!user.isVerified) {
    return next(new ErrorResponse('Please verify your email', 403));
  }

  // 👇 Remove this check, since we're auto-reactivating
  // if (!user.isActive) {
  //   return next(new ErrorResponse('Account is deactivated', 403));
  // }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new ErrorResponse('Invalid credentials', 401));

  // ✅ Reactivate account on successful login
  if (!user.isActive) {
    user.isActive = true;
    await user.save(); // Save the updated status
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });

  res.status(200).json({ success: true, token });
}));




// 🔐 Get all users (with pagination)
router.get('/users', protect, requireRole('admin'), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select('-password')
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await User.countDocuments();
  
  res.json({
    users,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    }
  });
});

// 🔐 Get single user with orders
router.get('/users/:id', protect, requireRole('admin'), async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').lean();
  if (!user) return res.status(404).json({ message: 'User not found' });

  const orders = await Order.find({ user: req.params.id })
    .sort('-createdAt')
    .limit(5);
console.log("Recent orders for user:", user._id, orders);

  res.json({ ...user, recentOrders: orders });
});

// 🔐 Update user status
router.put('/users/:id', protect, requireRole('admin'), async (req, res) => {
  const { isActive, isVerified } = req.body;
  
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (typeof isActive === 'boolean') user.isActive = isActive;
  if (typeof isVerified === 'boolean') user.isVerified = isVerified;

  await user.save();
  res.json(user);
});

// 🔐 Update user details
router.put('/users/:id/details', protect, requireRole('admin'), async (req, res) => {
  try {
    const allowedFields = ['name', 'email', 'phone'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🔐 Search users
router.get('/search/users', protect, requireRole('admin'), async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ message: 'Search query required' });

  const users = await User.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { phone: { $regex: query, $options: 'i' } }
    ]
  }).select('-password').limit(20);

  res.json(users);
});

router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.deleteOne(); // or user.remove()

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google Auth Route
router.post('/google', asyncHandler(async (req, res, next) => {
  const { uid, email, name, photoURL } = req.body;

  if (!uid || !email) {
    return next(new ErrorResponse('Invalid Google credentials', 400));
  }

  // Check if user exists
  let user = await User.findOne({ $or: [{ email }, { uid }] });

  if (!user) {
    // Create new user if doesn't exist
    user = await User.create({
      uid,
      email,
      name: name || email.split('@')[0],
      photoURL,
      isVerified: true,
      isActive: true,
      authProvider: 'google'
    });
  } else {
    // Update existing user if needed
    if (!user.uid) user.uid = uid;
    if (!user.isVerified) user.isVerified = true;
    if (!user.isActive) user.isActive = true;
    if (photoURL && !user.photoURL) user.photoURL = photoURL;
    await user.save();
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });

  res.status(200).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      role: user.role
    }
  });
}));

module.exports = router;
