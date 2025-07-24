const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    detailedRatings: {
        type: Map,
        of: Number,
        validate: {
            validator: function (map) {
                for (let value of map.values()) {
                    if (value < 1 || value > 5) return false;
                }
                return true;
            },
            message: 'Each detailed rating must be between 1 and 5'
        }
    },
    comment: {
        type: String,
        required: true,
        maxlength: 500
    },
    adminComment: {
        type: String,
        default: ""
    },
    images: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Static method to get average rating
reviewSchema.statics.getAverageRating = async function (productId) {
    const obj = await this.aggregate([
        { $match: { product: productId } },
        { $group: { _id: '$product', averageRating: { $avg: '$rating' } } }
    ]);

    try {
        await this.model('Product').findByIdAndUpdate(productId, {
            averageRating: obj[0] ? Math.round(obj[0].averageRating * 10) / 10 : 0
        });
    } catch (err) {
        console.error(err);
    }
};

// Call getAverageRating after save
reviewSchema.post('save', function () {
    this.constructor.getAverageRating(this.product);
});

// Call getAverageRating after remove
reviewSchema.post('remove', function () {
    this.constructor.getAverageRating(this.product);
});

module.exports = mongoose.model('Review', reviewSchema);