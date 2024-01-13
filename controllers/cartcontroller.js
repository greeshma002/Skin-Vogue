const express = require("express");
const router = express.Router();
router.use(express.json());
const path = require("path");
const ObjectId = require("mongoose").Types.ObjectId;
const mongoose = require("mongoose");
const Coupon = require("../models/couponSchema");
const collection = require("../models/UserSchema");
const address = require("../models/addressSchema");
const Product = require("../models/productSchema");
const Category = require("../models/CategorySchema");
const Cart = require("../models/cartSchema");
const { log } = require("console");
const Order = require("../models/orderSchema");
const coupon = require("../models/couponSchema");
const wallet = require("../models/walletSchema");

//razorpay

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const Razorpay = require("razorpay");
let instance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

exports.cartcontroller = async (req, res) => {
  try {
    const productid = req.params.productid;
    let email = req.session.user;
    console.log(email);
    console.log(productid);

    const productId = await Product.findById({ _id: productid });

    const username = await collection.findOne({ email });

    const existingCart = await Cart.findOne({ userId: username._id });

    if (existingCart) {
      let itemIndex = existingCart.product.findIndex(
        (p) => p.productId.toString() === productId._id.toString()
      );

      if (itemIndex > -1) {
        const productQuantity = productId.productQuantity;
        console.log(productQuantity);

        const maxQuantity = productQuantity;
        if (existingCart.product[itemIndex].quantity < maxQuantity) {
          existingCart.product[itemIndex].quantity += 1;
        } else {
          return res
            .status(400)
            .json({ message: "Product is currently Out of Stock" });
        }
      } else {
        // If product does not exist in cart, add new item
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
    let err = req.query.err ?? "";
    let totalPrice = 0;
    const coupons = await coupon.find();
    const cartdata = await Cart.findOne({ userId: req.session.userId }).lean();
    if (cartdata) {
      for (let i = 0; i < cartdata.product.length; i++) {
        cartdata.product[i].productQuantity = (
          await Product.findById(cartdata?.product[i].productId)
        ).productQuantity;
        if (Product.productQuantity > 0) {
          totalPrice += Product.productPrice * Product.quantity;
        }
      }
    }
    res.render("user/Cart", {
      cartdata,
      calculateTotalPrice,
      totalPrice,
      coupons,
      err: err,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Function to calculate discounted price
function calculateDiscountedPrice(actualPrice, discountPercentage) {
  const discountAmount = (discountPercentage / 100) * actualPrice;
  return actualPrice - discountAmount;
}

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
  try {
    console.log(req.params);
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "product does not exist." });
    }

    const newQuantity = parseInt(req.body.quantity);
    console.log(req.body);

    if (newQuantity > product.productQuantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // Find the cart of the user.
    const cartData = await Cart.findOne({ userId: req.session.userId });
    if (!cartData) {
      return res.status(404).json({ message: "cart not found" });
    }

    const productInCartIndex = cartData.product.findIndex(
      (prod) => prod.productId.toString() === product._id.toString()
    );
    console.log(cartData.product);
    if (productInCartIndex === -1) {
      return res.status(404).json({ message: "product not in user's cart " });
    }

    cartData.product[productInCartIndex].quantity = newQuantity;
    await cartData.save();

    res
      .status(202)
      .json({ message: "success", totalPrice: calculateTotalPrice(cartData) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "internal server error" });
  }
};

exports.checkoutpage = async (req, res) => {
  try {
    const couponId = req.query?.id;
    let selectedCoupon;
    if (couponId) {
      selectedCoupon = await Coupon.findOne({
        _id: couponId,
      });
    }
    console.log(couponId);
    const username = await collection.findOne({ email: req.session.user });
    const cartdata = await Cart.findOne({ userId: req.session.userId });
    const userWallet = await wallet.findOne({ user: username._id });
    const products = await Product.find({});

    let product;
    let allProducts = [];
    let qtyErr = false;
    if (!cartdata) {
      console.log(cartdata?.product);
      return res.redirect("/cartdetails");
    }
    cartdata.product.forEach((prod) => {
      products.forEach((ele) => {
        if (prod.productId.equals(ele._id)) {
          allProducts.push(ele);
          product = ele;
        }
      });
      if (product.productQuantity < prod.quantity) {
        qtyErr = true;
      }
    });
    let total = cartdata.product.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
    if (selectedCoupon) {
      const discountPercentage = selectedCoupon.discountPercentage;
      total -= (total * discountPercentage) / 100;
    }

    console.log(selectedCoupon);

    if (qtyErr) {
      return res.redirect("/cartdetails?err=er");
    }

    const addresses = await address.find({ userId: username._id });

    res.render("user/checkoutpage", {
      addresses,
      username,
      userWallet,
      total,
      calculateTotalPrice,
      cartdata,
      allProducts,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error checkout");
  }
};

exports.checkoutdetails = async (req, res) => {
  console.log("[route/checkoutdetails] entered");
  try {
    let email = req.session.user;
    console.log(email);
    const username = await collection.findOne({ email });
    //const addresses = await address.find({ userId: username._id });

    const newdata = {
      userId: username._id,
      Address: req.body.Address,
      city: req.body.city,
      state: req.body.state,
      pin: req.body.pin,
      phone: req.body.phone,
    };

    console.log(req.body);
    await address.create(newdata);
    console.log(userId);
    const addresses = await address.find({ userId: username._id });
    console.log(addresses);
    console.log("hello");
    res.render("user/checkoutpage", { addresses });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

exports.confirmpage = async (req, res) => {
  try {
    res.render("user/orderconfirmpage");
  } catch (error) {
    console.log(error.message);
  }
};

exports.placeOrder = async (req, res) => {
  console.log("here");

  let paymentOption;
  let addressCheckbox;

  try {
    if (req.body.razorpay_order_id) {
      // Online payment
      console.log(req.body.razorpay_order_id);
      const order = await instance.orders.fetch(req.body.razorpay_order_id);
      //  console.log("order details : ",JSON.stringify(order));
      const total = Number(order.amount);
      console.log(total);
      console.log("address====", order.notes?.addressId);

      if (order.notes.address === "") {
        return res.send("select address");
      }

      paymentOption = "online";
      addressCheckbox = order.notes?.addressId;

      orderStatus = "confirmed";
      paymentId = order.id;
    } else {
      paymentOption = req.body.paymentOption;
      addressCheckbox = req.body.addressCheckbox;
    }

    const cartdata = await Cart.findOneAndDelete({
      userId: req.session.userId,
    });

    const products = cartdata.product.map((e) => ({
      price: e.price,
      quantity: e.quantity,
      productId: e.productId,
      productName: e.productName,
      image: e.image[0],
      totalAmount: e.totalAmount,
    }));

    const totalPrice = calculateTotalPrice(cartdata);

    const newOrder = await Order.create({
      userId: req.session.userId,
      products: products,
      paymentMethod: paymentOption,
      totalAmount: totalPrice,
      addressId: addressCheckbox,
    });

    for (const product of products) {
      const existingProduct = await Product.findById(product.productId);

      if (existingProduct) {
        if (existingProduct.productQuantity < product.quantity) {
          console.error(
            "Insufficient quantity for product:",
            existingProduct.productName
          );
          return res.status(400).send("Insufficient product quantity");
        }

        existingProduct.productQuantity -= product.quantity;

        await existingProduct.save();
      } else {
        console.error("Product not found:", product.productId);
        return res.status(404).send("Product not found");
      }
    }

    res.render("user/orderconfirmpage");
  } catch (error) {
    console.error("Error in placeOrder:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.orderdetailpage = async (req, res) => {
  try {
    let ordersOfUser = await Order.find({ userId: req.session.userId })
      .populate("addressId")
      .exec();
    let allProducts = [];
  //  console.log(ordersOfUser);
    console.log("=========================");
    for (let order of ordersOfUser) {
      // console.log(order.addressId);
      for (let product of order.products) {
        allProducts.push({
          orderId: order._id,
          productId: product.productId,
          quantity: product.quantity,
          Address: {
            name: order.addressId?.name,
            address: order.addressId?.Address,
            state: order.addressId?.state,
            pin: order.addressId?.pin,
            phone: order.addressId?.phone,
          },
          price: product.price,
          productName: product.productName,
          orderStatus: order.orderStatus,
          image: product.image[0],
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
        });
        // console.log("hiiiiiiiiiiiiiiiiiiiiiiiii" ,allProducts);
      }
    }
    ordersOfUser = ordersOfUser.reverse();
    //console.log(allProducts);
    res.render("user/orderdetailpage", { ordersOfUser });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

exports.uservieworder = async (req, res) => {
  try {
    let ordersOfUser = await Order.find({ userId: req.session.userId })
    .populate("addressId")
    .exec();
    // let ordersOfUser = await Order.find({ _id: req.params.id });
    let allProducts = [];
   // console.log(ordersOfUser);
    console.log("=========================");
    for (let order of ordersOfUser) {
      for (let product of order.products) {
       
        allProducts.push({
          orderId: order._id,
          productId: product.productId,
          quantity: product.quantity,
          price: product.price,
          productName: product.productName,
          orderStatus: order.orderStatus,
          Address: {
            name: order.addressId?.name,
            address: order.addressId.Address,
            state: order.addressId?.state,
            pin: order.addressId?.pin,
            phone: order.addressId?.phone,
          },
          image: product.image[0],
        });
      }
    }
    ordersOfUser = ordersOfUser.reverse();
    console.log("SEEEEE" ,ordersOfUser);
    res.render("user/uservieworder", { ordersOfUser, allProducts });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


exports.cancelorder = async (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = "cancelled";
  console.log(orderId);

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: newStatus },
      { new: true }
    );

 
    if (!updatedOrder) {
      return res.status(404).json({ status: "error", message: "Order not found" });
    }

    
    for (const product of updatedOrder.products) {
      const existingProduct = await Product.findById(product.productId);

      if (existingProduct) {
       
        existingProduct.productQuantity += product.quantity;

      
        await existingProduct.save();
      } else {
        console.error('Product not found:', product.productId);
        return res.status(404).json({ status: "error", message: "Product not found" });
      }
    }

  
    if (updatedOrder.paymentMethod == "UPI" || "WALLET") {
      let userWallet = await wallet.findOne({ user: req.session.userId });

      if (!userWallet) {
       
        userWallet = new wallet({ user: userId, balance: 0 });
        await userWallet.save();
      }

      userWallet.balance += updatedOrder.totalAmount;
      await userWallet.save();
    }

    res.redirect("/orderdetail");
    // res.json({ status: 'success', updatedOrder });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};
