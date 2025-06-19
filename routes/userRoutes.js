const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   POST api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', authController.signup);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

module.exports = router;