const express = require("express");
const router = express.Router();
router.use(express.json());
const path = require("path");
const ObjectId = require("mongoose").Types.ObjectId;

const collection = require("../models/UserSchema");
const Product = require("../models/productSchema");
const Category = require("../models/CategorySchema");
const Cart = require("../models/cartSchema");
const { log } = require("console");

exports.cartcontroller = async (req, res) => {
  try {
    const productid = req.params.productid;
    let email = req.session.user;
    console.log(email);

    const productId = await Product.findById({ _id: productid });
    const username = await collection.findOne({ email });

    const cartData = {
      userId: username._id,
      product: [
        {
          productId: productId._id,
          productName: productId.productName,
          price: productId.productPrice,
          quantity: 1,
          image: productId.images[0],
        },
      ],
    }

    const existingProductIndex = cartData.product.findIndex(
      (item) => item.productId.toString() === productId._id.toString()
    );
    
    if (existingProductIndex !== -1) {
      cartData.product[existingProductIndex].quantity += 1;
    } else {
      cartData.product.push({
        productId: productId._id,
        productName: productId.productName,
        price: productId.productPrice,
        quantity: 1,
        image: productId.images[0],
      });
    }
    
    const existingCart = await Cart.findOne({ userId: req.session.userId });
    
    if (existingCart) {
      await Cart.findOneAndUpdate(
        { userId: req.session.userId },
        {
          $addToSet: {
            product: { $each: cartData.product },
          },
        },
        { new: true }
      );
    } else {
      // Create a new cart
      await Cart.create(cartData);
    }
    res.redirect("/cartdetails");
    } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
    }
    };
    

function calculateTotalPrice(cartdata) {
  if (!cartdata || !cartdata.product || cartdata.product.length === 0) {
    return 0; 
  }

  return cartdata.product.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );
}


exports.cartdetails = async (req, res) => {
  try {
    const cartdata = await Cart.findOne({ userId: req.session.userId });
    res.render("user/Cart", { cartdata, calculateTotalPrice });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteCart = async (req, res) => {
  try {
    const productid = req.params.productid;
    await Cart.findOneAndUpdate(
      { userId: req.session.userId },
      { $pull: { product: { productId: productid } } },
      { new: true }
    );

    res.redirect("/cartdetails");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

exports.checkoutpage = async (req, res) => {
  try {
    res.render("user/checkoutpage");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};
