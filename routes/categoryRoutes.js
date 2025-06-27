const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Create new category
// Create new category with optional subcategories
router.post('/', async (req, res) => {
  try {
    const { name, imageUrl, subcategories = [] } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    // Filter subcategories: only include valid name strings
    const validSubcategories = subcategories
      .filter(sub => sub?.name && typeof sub.name === 'string')
      .map(sub => ({ name: sub.name.trim() }));

    const category = new Category({
      name: name.trim(),
      imageUrl,
      subcategories: validSubcategories
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get all categories with subcategories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, imageUrl, subcategories = [] } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Prevent duplicate category names (other than itself)
    const existingCategory = await Category.findOne({ name, _id: { $ne: req.params.id } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Another category with this name already exists' });
    }

    // Update fields
    category.name = name.trim();
    category.imageUrl = imageUrl || '';

    // Replace all subcategories with new ones
    category.subcategories = subcategories
      .filter(sub => sub?.name && typeof sub.name === 'string')
      .map(sub => ({ name: sub.name.trim() }));

    await category.save();
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;