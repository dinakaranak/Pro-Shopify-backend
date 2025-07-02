const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  originalPrice: {
    type: Number,
    required: [true, 'Original price is required'],
    min: [0.01, 'Price must be at least 0.01']
  },
  discountPrice: {
    type: Number,
    required: [true, 'Discounted price is required'],
    min: [0.01, 'Discount price must be at least 0.01']
  },
  discountPercent: {
    type: Number,
    min: [0, 'Discount percent must be >= 0'],
    max: [100, 'Discount percent must be <= 100'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Product category is required']
  },
  subcategory: {
    type: String,
    required: [true, 'Product subcategory is required']
  },
  brand: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true
  },
  images: {
    type: [String], // Array of image URLs
    default: []
  },
  colors: {
    type: [String], // e.g., ["Red", "Blue", "Black"]
    default: []
  },
  sizeChart: {
    type: [
      {
        label: { type: String }, // e.g., "M", "28", "XL"
        stock: { type: Number, min: 0 }

      }
    ],
    default: []
  },
  stock: {
    type: Number,
    required: [true, 'Total stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
