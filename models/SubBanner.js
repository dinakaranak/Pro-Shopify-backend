const mongoose = require('mongoose');

const subbannerSchema = new mongoose.Schema({
    title: { type: String, required: false },
    subtitle: { type: String, required: false },
    price: { type: Number, required: false },
    imageUrl: { type: String, required: true },
    buttonText: { type: String, default: 'SHOP NOW' },
    isFeatured: { type: Boolean, default: false },
    link: { type: String, default: '' }, // Add link field
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SubBanner', subbannerSchema);