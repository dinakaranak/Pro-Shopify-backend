const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// Get Current User Route
router.get('/me', protect, asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
}));

// Update user details (name, phone)
router.put('/update', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, phone } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
// PUT /api/users/logout
router.put('/logout', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = false; // 👈 Only this line is required
    await user.save();

    res.json({ message: 'User account deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user account
router.delete('/delete-account', protect, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new address
router.post('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // If setting as default, unset other defaults
    if (req.body.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    user.addresses.push(req.body);
    await user.save();
    
    res.status(201).json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/addresses/:addressId
router.delete('/addresses/:addressId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const originalLength = user.addresses.length;

    // Filter out the address with the given ID
    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== req.params.addressId
    );

    if (user.addresses.length === originalLength) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await user.save();
    res.status(200).json({ message: 'Address deleted successfully', addresses: user.addresses });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
