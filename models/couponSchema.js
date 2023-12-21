const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true, // Ensure coupon codes are unique
  },
  discountPercentage: {
    type: String,
    required: true,
  
  },
  minValue: {
    type: Number,
    required: true,
  },
  maxValue: {
    type: Number,
    required: true,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model('Coupon', couponSchema);
