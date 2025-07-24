const mongoose = require('mongoose');

const supplierProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  originalPrice: { type: Number, required: true, min: 0.01 },
  discountPrice: { type: Number, required: true, min: 0.01 },
  discountPercent: { type: Number, min: 0, max: 100, default: 0 },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  brand: { type: String, required: true },
  images: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  sizeChart: [
    {
      label: { type: String },
      stock: { type: Number, min: 0 }
    }
  ],
  stock: { type: Number, required: true, default: 0 },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminRemarks: { type: String, default: '' },

  specifications: [{
    key: { type: String, required: true },
    value: { type: String, required: true }
  }],
  featureDescriptions: [{
    title:{type:String},
    description: { type: String, required: true },
    image: { type: String } // URL for feature image
  }],
}, { timestamps: true });

module.exports = mongoose.model('SupplierProduct', supplierProductSchema);
