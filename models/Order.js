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
    fullName: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zip: String,
  },
  paymentMethod: String,
  status: { type: String, default: 'pending' },
  trackingId: String,
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
