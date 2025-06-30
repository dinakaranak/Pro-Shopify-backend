const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OtpToken = require('../models/OtpToken');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorHandler').ErrorResponse;
const nodemailer = require('nodemailer');
const { protect } = require('../middlewares/authMiddleware');

// Send email helper
const sendEmail = async (email, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject,
    text
  });
};

// Generate random 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Signup Route
router.post('/signup', asyncHandler(async (req, res, next) => {
  const { email, password,name } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already in use', 400));
  }

  const user = await User.create({ email, password,name });

  const otp = generateOtp();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await OtpToken.create({ userId: user._id, otp, expiresAt: expiry });
  await sendEmail(email, 'Verify your email', `Your OTP is: ${otp}`);

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

  if (!email || !password) return next(new ErrorResponse('Please provide email and password', 400));

  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new ErrorResponse('Invalid credentials', 401));

  if (!user.isVerified) return next(new ErrorResponse('Please verify your email', 403));
  if (!user.isActive) return next(new ErrorResponse('Account is deactivated', 403));

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new ErrorResponse('Invalid credentials', 401));

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });

  res.status(200).json({ success: true, token });
}));

// Get Current User Route
router.get('/me', protect, asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
}));

module.exports = router;
