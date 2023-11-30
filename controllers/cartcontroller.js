const express = require("express");
const router = express.Router();
router.use(express.json());
const path = require("path");
const ObjectId = require("mongoose").Types.ObjectId;

const collection = require("../models/UserSchema");
const Product = require("../models/productSchema");
const Category = require("../models/CategorySchema");
const cart = require("../models/cartSchema");
const { log } = require("console");

exports.cartcontroller = async (req, res) => {
  const productid = req.params.productid;
  let email = req.session.user;
  console.log(email);
  const productId = await Product.findById({ _id: productid });
  const username = await collection.findOne({email});
  const cartdata = await cart.find({userId:req.session.userId,})

  const cartData = { 
    userId: username._id,
    name: username.name,
    productId: productId._id,
    productName: productId.productName,
    price: productId.productPrice,
    quantity: 1,
    image: productId.images[0],
  };

  await cart.insertMany([cartData]).then(() => {
    res.redirect("/cartdetails");
  });
};



exports.cartdetails = async (req,res) => {
  const cartdata = await cart.find({userId:req.session.userId})
    res.render('user/Cart',{cartdata})
}