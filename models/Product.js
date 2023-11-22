const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    
  },
  productDescription: {
    type: String,
  },
  category: {
    // type: mongoose.Schema.Types.ObjectId,
    type:String,
    unique:true,
    // required: true,
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
    type:[String],
    required: true
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
