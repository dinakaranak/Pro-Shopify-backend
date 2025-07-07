const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const { protect } = require('../middlewares/authMiddleware');

// GET /wishlist - Get user's wishlist
router.get('/', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('items.product');
      
    if (!wishlist) {
      return res.status(200).json({ items: [] }); // Return empty array if no wishlist exists
    }
    
    res.status(200).json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /wishlist - Add item to wishlist
router.post('/', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user._id,
        items: [{ product: productId }]
      });
    } else {
      // Check if product already exists in wishlist
      const itemExists = wishlist.items.some(
        item => item.product.toString() === productId
      );
      
      if (itemExists) {
        return res.status(400).json({ message: 'Product already in wishlist' });
      }
      
      wishlist.items.push({ product: productId });
    }

    await wishlist.save();
    res.status(201).json(wishlist);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /wishlist/:itemId - Remove item from wishlist
router.delete('/:itemId', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }
    
    const initialLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(
      item => item._id.toString() !== req.params.itemId  // Changed from item.product to item._id
    );
    
    if (wishlist.items.length === initialLength) {
      return res.status(404).json({ message: 'Item not found in wishlist' });
    }
    
    await wishlist.save();
    res.status(200).json({
      message: 'Item removed successfully',
      wishlist
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/count', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const count = wishlist ? wishlist.items.length : 0;
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;