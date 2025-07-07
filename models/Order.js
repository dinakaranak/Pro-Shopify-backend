const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
    }
  ],
  shippingAddress: {
    label: { type: String, required: false }, // Home, Work, etc.
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  paymentMethod: String,
  status: { type: String, default: 'pending' },
  trackingId: String,
  total: { type: Number, required: true }, // Total amount for the order
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
