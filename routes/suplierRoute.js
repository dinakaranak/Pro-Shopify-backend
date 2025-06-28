const express = require('express');
const router = express.Router();
const SupplierProduct = require('../models/SupplierProduct');
const Product = require('../models/Product');
const { protect, requireRole } = require('../middlewares/authMiddleware');

// Supplier: Create product
router.post('/', protect, async (req, res) => {
  try {
    // if (req.user.role !== 'supplier') {
    //   return res.status(403).json({ message: 'Access denied' });
    // }
    const newProduct = await SupplierProduct.create({
      ...req.body,
      addedBy: req.user._id
    });
console.log("New Supplier Product Created:", newProduct);

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// Get single product (only if it belongs to the supplier)
router.get('/myproducts/:id', protect, async (req, res) => {
  try {
    console.log(req.user);
    
    // Only suppliers can access their own product
    // if (req.user.role !== 'supplier') {
    //   return res.status(403).json({ message: 'Access denied' });
    // }
console.log("Fetching Supplier Product ID:", req.params.id);

    const products = await SupplierProduct.find({ addedBy: req.params.id }).sort({ createdAt: -1 });
console.log("Fetching Supplier Product:", products);

    if (!products) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    // if (products.addedBy.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ message: 'You can only view your own product' });
    // }

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all pending supplier products
router.get('/pending', protect, requireRole('admin'), async (req, res) => {
  try {
    const pending = await SupplierProduct.find({ status: 'pending' }).populate('addedBy', 'name email');
    console.log("Pending Supplier Products:", pending);
    
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Approve product
router.post('/approve/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const sp = await SupplierProduct.findById(req.params.id);
    if (!sp) return res.status(404).json({ message: 'Product not found' });

    const approved = await Product.create({
      name: sp.name,
      description: sp.description,
      originalPrice: sp.originalPrice,
      discountPrice: sp.discountPrice,
      discountPercent: sp.discountPercent,
      category: sp.category,
      subcategory: sp.subcategory,
      brand: sp.brand,
      images: sp.images,
      colors: sp.colors,
      sizeChart: sp.sizeChart,
      stock: sp.stock,
      addedBy: sp.addedBy
    });

    sp.status = 'approved';
    await sp.save();

    res.json({ message: 'Product approved and published', approved });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Reject product
router.post('/reject/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const sp = await SupplierProduct.findById(req.params.id);
    if (!sp) return res.status(404).json({ message: 'Product not found' });

    sp.status = 'rejected';
    sp.adminRemarks = req.body.remarks || '';
    await sp.save();

    res.json({ message: 'Product rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
