

const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'collection_1', 
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      productName : {
        type: String,
        required:true
      },
      image: {
        type:[String]
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
