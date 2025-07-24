const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, requireRole } = require('../middlewares/authMiddleware');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { productId, rating, comment, images, detailedRatings } = req.body;
    
    // Convert detailedRatings object to Map
    const ratingsMap = new Map();
    if (detailedRatings) {
      for (const [key, value] of Object.entries(detailedRatings)) {
        ratingsMap.set(key, value);
      }
    }

    const review = new Review({
      product: productId,
      user: req.user.id,
      rating,
      comment,
      images,
      detailedRatings: ratingsMap
    });
    
    await review.save();
    
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
      
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/admin
// @access  Private/Admin
router.get('/admin', protect,requireRole('admin'), async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name')
      .populate('product', 'name')
      .sort({ createdAt: -1 });
      
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Add this to your review routes
router.put('/admin-comment/:id', protect,requireRole('admin'), async (req, res) => {
  try {
    console.log(`Current admin comment: ${req.body}`);

    console.log(`Updating admin comment for review ID: ${req.params.id}`);
    
    const review = await Review.findById(req.params.id);
    console.log(`Found review: ${review ? 'Yes' : 'No'}`);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
console.log(`Current admin comment: ${req.body.adminComment}`);

    review.adminComment = req.body.adminComment;
    await review.save();

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a review (Admin)
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.deleteOne(); // OR use findByIdAndDelete directly
    res.json({ message: 'Review removed' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});


module.exports = router;