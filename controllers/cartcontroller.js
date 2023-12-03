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

    const existingCart = await Cart.findOne({ userId: username._id });

    if (existingCart) {
      // If cart exists for the user
      let itemIndex = existingCart.product.findIndex(p => p.productId.toString() === productId._id.toString());

      if (itemIndex > -1) {
        // If product exists in the cart, update the quantity
        existingCart.product[itemIndex].quantity += 1;
      } else {
        // If product does not exists in cart, add new item
        existingCart.product.push({
          productId: productId._id,
          productName: productId.productName,
          price: productId.productPrice,
          quantity: 1,
          image: productId.images[0],
        });
      }
      await existingCart.save();
    } else {
      // If no cart exists, create one
      const newCartData = {
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
      };
      await Cart.create(newCartData);
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
exports.updQuantity = async (req, res) => {
  try{
    const product = await Product.findOne({ _id: req.params.productId });
    product.quantity += parseInt(req.query.change);
    if (product.quantity < 0) {
        product.quantity = 0;
    }
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
 }
 






 
