const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, requireRole } = require('../middlewares/authMiddleware');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
router.post('/', protect,requireRole('admin'),async (req, res) => {
  try {
    const {
      name,
      description,
      originalPrice,
      discountPrice,
      discountPercent,
      category,
      subcategory,
      brand,
      images,
      colors,
      sizeChart,
      stock
    } = req.body;

    const product = new Product({
      name,
      description,
      originalPrice,
      discountPrice,
      discountPercent,
      category,
      subcategory,
      brand,
      images: images || [],
      colors: colors || [],
      sizeChart: sizeChart || [],
      stock,
      addedBy: req.user._id

    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', protect,requireRole('admin'), async (req, res) => {
  try {
    const {
      name,
      description,
      originalPrice,
      discountPrice,
      discountPercent,
      category,
      subcategory,
      brand,
      images,
      colors,
      sizeChart,
      stock
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.name = name || product.name;
    product.description = description || product.description;
    product.originalPrice = originalPrice ?? product.originalPrice;
    product.discountPrice = discountPrice ?? product.discountPrice;
    product.discountPercent = discountPercent ?? product.discountPercent;
    product.category = category || product.category;
    product.subcategory = subcategory || product.subcategory;
    product.brand = brand || product.brand;
    product.images = images || product.images;
    product.colors = colors || product.colors;
    product.sizeChart = sizeChart || product.sizeChart;
    product.stock = stock ?? product.stock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', protect,requireRole('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.deleteOne(); // <-- use this instead
    res.json({ message: 'Product removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});


module.exports = router;
