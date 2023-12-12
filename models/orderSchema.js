const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const address = require("../models/addressSchema"); // Import the Address schema

const orderSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "collection_1",
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
  paymentMethod: {
    type: String,
    enum: ["cod", "wallet", "card"],
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  orderStatus: {
    type: String,
    default: "Pending",
  },
  addressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: true,
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
