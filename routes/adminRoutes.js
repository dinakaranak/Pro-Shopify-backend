// routes/adminUserRoutes.js
const express = require('express');
const AdminUser = require('../models/AdminUser');
const { protect, requireRole } = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await AdminUser.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

  if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
  });
});

// All admin & suppliers
router.get('/', protect, requireRole('admin'), async (req, res) => {
    const users = await AdminUser.find();
    res.json(users);
});
// Get by ID
router.get('/:id', protect, requireRole('admin'), async (req, res) => {
    const user = await AdminUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
});

// Update name, role, permissions
router.patch('/:id', protect, requireRole('admin'), async (req, res) => {
    const { name, role, permissions } = req.body;
    const user = await AdminUser.findByIdAndUpdate(
        req.params.id,
        { name, role, permissions },
        { new: true }
    );
    res.json(user);
});

// Activate/deactivate
router.patch('/:id/status', protect, requireRole('admin'), async (req, res) => {
    const user = await AdminUser.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
});

// Delete
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
    await AdminUser.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
});

// Create a new admin or supplier
router.post('/', protect, requireRole('admin'), async (req, res) => {
    const { name, email, password, role, permissions } = req.body;
console.log("Creating user with data:", { name, email, role, permissions });

    // Check if email already exists
    const exists = await AdminUser.findOne({ email });
    if (exists) {
        return res.status(400).json({ message: 'Email already in use' });
    }

    // Create the user
    const newUser = new AdminUser({
        name,
        email,
        password,
        role: role || 'supplier', // Default to supplier if not given
        permissions: permissions || [], // Optional
    });

    await newUser.save();

    res.status(201).json({
        message: `${role || 'supplier'} account created`,
        user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            isActive: newUser.isActive,
        },
    });

});

module.exports = router;
