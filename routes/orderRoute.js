const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { protect, requireRole } = require('../middlewares/authMiddleware');
const mongoose = require('mongoose');
// 📦 Place a new order (user or supplier)
const User = require('../models/User'); // make sure you import this

router.post('/', protect, async (req, res) => {
  const { shippingAddress, paymentMethod, mode, productId, quantity } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  // Update user phone and address
  if (shippingAddress?.phone && !user.phone) user.phone = shippingAddress.phone;

  const isDuplicate = user.addresses.some(addr =>
    addr.street === shippingAddress.address &&
    addr.city === shippingAddress.city &&
    addr.postalCode === shippingAddress.zip
  );

  if (!isDuplicate) {
    user.addresses.forEach(addr => (addr.isDefault = false));
    user.addresses.push({
      label: 'Shipping',
      street: shippingAddress.address,
      city: shippingAddress.city,
      state: shippingAddress.state,
      postalCode: shippingAddress.zip,
      country: 'India',
      isDefault: true,
    });
  }

  await user.save();

  let items = [];

  if (mode === 'buy-now') {
    // get just that product from cart
    items = cart.items.filter(i => i.productId.equals(productId));
    if (items.length === 0) {
      return res.status(400).json({ message: 'Buy-now item not found in cart' });
    }
  } else {
    items = cart.items;
  }

  // Create order
  const order = new Order({
    user: userId,
    items,
    shippingAddress,
    paymentMethod,
    status: 'pending',
  });

  await order.save();

  // Clean up cart
  if (mode === 'buy-now') {
    cart.items = cart.items.filter(i => !i.productId.equals(productId));
    if (cart.items.length === 0) {
      await Cart.deleteOne({ user: userId });
    } else {
      await cart.save();
    }
  } else {
    await Cart.deleteOne({ user: userId });
  }

  res.status(201).json(order);
});



// 👤 Get logged-in user's orders
router.get('/', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});
router.get('/admin/:id', protect, requireRole('admin'), async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

// 👤 Get a specific order (only owner can see it)
router.get('/:id', protect, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

// 🔐 Admin: Get all orders
router.get('/admin/all', protect, requireRole('admin'), async (req, res) => {
  const orders = await Order.find().populate('user').sort({ createdAt: -1 });
  res.json(orders);
});

// 🔐 Admin: Update order status
router.put('/admin/:id', protect, requireRole('admin'), async (req, res) => {
  const { status, trackingId } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.status = status || order.status;
  if (trackingId) order.trackingId = trackingId;
  await order.save();

  res.json(order);
});


// Get user orders
router.get('/users/:id/orders', protect, requireRole('admin'), async (req, res) => {
  try {
    console.log("Fetching orders for user ID:", req.params.id);
    
    const orders = await Order.find({ user: req.params.id })
      .sort('-createdAt')
      .limit(5)
      .lean();
      
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user stats
router.get('/users/:id/stats', protect, requireRole('admin'), async (req, res) => {
  try {
    console.log("Fetching stats for user ID:", req.params.id);
    
    const stats = await Order.aggregate([
      { $match: { user:new mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
          lastOrder: { $max: '$createdAt' }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      avgOrderValue: 0,
      lastOrder: null
    };
    
    res.json(result);
  } catch (err) {
  console.error('Stats error:', err); // helpful log
  res.status(500).json({ message: 'Server error' });
}
});

module.exports = router;
