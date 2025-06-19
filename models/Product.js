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
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0.01, 'Price must be at least 0.01']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: [
        'Electronics',
        'Clothing',
        'Home & Kitchen',
        'Books',
        'Beauty',
        'Sports',
        'Other'
      ],
      message: 'Please select a valid category'
    }
  },
  imageUrl: {
    type: String,
    default: ''
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);