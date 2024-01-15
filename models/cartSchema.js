const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "collection_1", 
    required: true,
  },
  product: [
    {
      productId: {
        type: mongoose.Schema.ObjectId,
        ref: "Product", 
        required: true,
      },
    
      quantity: {
        type: Number,
        required: true,
      },
      productName: {
        type: String,
      },
      price: {
        type: Number,
        required: true,
      },
      image: {
        type: [String],
      },
      
    },
  ],
},{timestamps:true});
const Cart = mongoose.model("cart", cartItemSchema);

module.exports = Cart;
