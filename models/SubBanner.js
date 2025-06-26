const mongoose = require('mongoose');

const subbannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    buttonText: { type: String, default: 'SHOP NOW' },
    isFeatured: { type: Boolean, default: false },
    link: { type: String, default: '' }, // Add link field
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SubBanner', subbannerSchema);