const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',  // Reference to your Product model
    required: [true, 'Product ID is required']
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    unique: true,  // One wishlist per user
    index: true    // For faster queries
  },
  items: [wishlistItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
wishlistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get user's wishlist
wishlistSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId }).populate('items.product');
};

module.exports = mongoose.model('Wishlist', wishlistSchema);