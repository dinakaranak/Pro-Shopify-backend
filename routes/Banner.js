const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');

// Create banner
router.post('/', async (req, res) => {
  try {
    const banner = new Banner(req.body);
    await banner.save();
    res.status(201).send(banner);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all banners
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.send(banners);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete banner
router.delete('/:id', async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).send();
    }
    res.send(banner);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;