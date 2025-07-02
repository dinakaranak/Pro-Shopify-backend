const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const { protect } = require('../middlewares/authMiddleware'); // ✅ use 'protect' instead of 'auth'

// 🛒 Get user's cart
router.get('/', protect, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.productId');
  res.json(cart || { items: [] });
});

// ➕ Add item to cart
router.post('/', protect, async (req, res) => {
  const { productId, quantity } = req.body;
  console.log("res", req.body);
  
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const index = cart.items.findIndex(i => i.productId.equals(productId));
  if (index > -1) {
    cart.items[index].quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }

  await cart.save();
  res.json(cart);
});

// ✏️ Update cart item quantity
router.put('/:itemId', protect, async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart?.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });

  item.quantity = quantity;
  await cart.save();
  res.json(cart);
});

// ❌ Remove item from cart
router.delete('/:itemId', protect, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  const originalLength = cart.items.length;

  // Remove the item by _id manually
  cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);

  if (cart.items.length === originalLength) {
    return res.status(404).json({ message: 'Item not found in cart' });
  }

  await cart.save();
  res.json(cart);
});


// 🔄 Clear cart
router.delete('/clear/all', protect, async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ message: 'Cart cleared' });
});

module.exports = router;
