const mongoose = require("mongoose");
const category = require("../models/CategorySchema");
const productSchema = new mongoose.Schema({
  productName: {
    type: String,
  },
  productDescription: {
    type: String,
  },
  category: {
    type: String,
    ref: "Category",
    required: true,
  },
  productPrice: {
    type: Number,
  },
  rating: {
    type: Number,
  },
  productQuantity: {
    type: Number,
  },
  images: {
    type: [String],
    required: true,
  },
  listed: {
    type: Boolean,
    default: true, // Set to true by default, assuming products are listed
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
