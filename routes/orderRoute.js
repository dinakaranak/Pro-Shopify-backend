const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { protect, requireRole } = require('../middlewares/authMiddleware');

// 📦 Place a new order (user or supplier)
router.post('/', protect, async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  const order = new Order({
    user: req.user._id,
    items: cart.items,
    shippingAddress,
    paymentMethod,
    status: 'pending',
  });

  await order.save();
  await Cart.deleteOne({ user: req.user._id });

  res.status(201).json(order);
});

// 👤 Get logged-in user's orders
router.get('/', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
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

module.exports = router;
