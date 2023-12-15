const express = require("express");
const router = express.Router();
router.use(express.json());
const path = require("path");
const ObjectId = require("mongoose").Types.ObjectId;
const mongoose = require("mongoose");

const collection = require("../models/UserSchema");
const address = require("../models/addressSchema");
const Product = require("../models/productSchema");
const Category = require("../models/CategorySchema");
const Cart = require("../models/cartSchema");
const { log } = require("console");
const Order = require("../models/orderSchema");

exports.cartcontroller = async (req, res) => {
  try {
    const productid = req.params.productid;
    let email = req.session.user;
    console.log(email);

    const productId = await Product.findById({ _id: productid });
    const username = await collection.findOne({ email });

    const existingCart = await Cart.findOne({ userId: username._id });

    if (existingCart) {
     
      let itemIndex = existingCart.product.findIndex(
        (p) => p.productId.toString() === productId._id.toString()
      );

      if (itemIndex > -1) {
       
        const productQuantity = req.params.productQuantity
    
        const maxQuantity = productQuantity; // Set your maximum quantity limit
        if (existingCart.product[itemIndex].quantity < maxQuantity) {
          existingCart.product[itemIndex].quantity += 1;
        } else {
          return res.status(400).json({ message: "Product is currently Out of Stock" });
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
   let err=req.query.err??''
    let totalPrice = 0;
    const cartdata = await Cart.findOne({ userId: req.session.userId }).lean();
    if (cartdata) {
      
      for (let i = 0; i < cartdata.product.length; i++) {
        cartdata.product[i].productQuantity = (await Product.findById(cartdata.product[i].productId)).productQuantity;
        if (Product.productQuantity > 0) {
          totalPrice += Product.productPrice * Product.quantity;
        }
      }
    }else{
      res.render("user/Cart", { cartdata:'', calculateTotalPrice, totalPrice,err:err });
    }
    res.render("user/Cart", { cartdata, calculateTotalPrice, totalPrice,err:err });
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
  try {
    console.log(req.params);
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "product does not exist."});
    }


    const newQuantity = parseInt(req.body.quantity);
    console.log(req.body);
    
    if (newQuantity > product.productQuantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // Find the cart of the user.
    const cartData = await Cart.findOne({ userId: req.session.userId  });
    if (!cartData) {
      return res.status(404).json({ message: "cart not found" });
    }

    const productInCartIndex = cartData.product.findIndex(prod => prod.productId.toString() === product._id.toString());
    console.log(cartData.product);
    if (productInCartIndex === -1) {
      return res.status(404).json({ message: "product not in user's cart "});
    }

    cartData.product[productInCartIndex].quantity = newQuantity;
    await cartData.save();

    res.status(202).json({ message: "success", totalPrice: calculateTotalPrice(cartData) });

  } catch (err) {
    console.error(err);
    res.status(500).json({message: "internal server error"})
  }
};

exports.checkoutpage = async (req, res) => {
  try {
    
    // const productId = req.params.productid;
    const cartdata = await Cart.findOne({ userId: req.session.userId });
    const products= await Product.find({})
    let product
    let allProducts=[]
    let qtyErr=false
    cartdata.product.forEach((prod)=>{
        products.forEach((ele)=>{
          if(prod.productId.equals(ele._id)){
            allProducts.push(ele)
            product=ele
          }
        })
        if(product.productQuantity<prod.quantity){
          qtyErr=true
        }
    })
    if(qtyErr){
      return res.redirect('/cartdetails?err=er')
    }
    // const productDetails = await Product.findById(productId);
    // const inStockProducts = cartdata.product.filter(Product => Product.quantity > 1);
    // console.log(inStockProducts);
    
   

    const username = await collection.findOne({ email: req.session.user });
    const addresses = await address.find({ userId: username._id });
   
    

    res.render("user/checkoutpage", {
      addresses,
      username,
     
      calculateTotalPrice,
      cartdata,
      allProducts,
    
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
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
  const { paymentOption, addressCheckbox } = req.body;

  const cartdata = await Cart.findOneAndDelete({ userId: req.session.userId });

  let products = cartdata.product.map((e) => {
    return {
      price: e.price, quantity: e.quantity, productId: e.productId , productName:e.productName ,  image: e.image[0] , totalAmount: e.totalAmount
    }
  });

  let totalPrice = calculateTotalPrice(cartdata);

  const newOrder = await Order.create({
    userId: req.session.userId,
    products: products,
    paymentMethod: paymentOption,
    totalAmount: totalPrice,
    addressId: addressCheckbox,
  });

  if (paymentOption === "cod") {
    res.render("user/orderconfirmpage");
  } else if (paymentOption === "card") {
    // handle Card logic
    res.send("Card not implemented.");
  } else if (paymentOption === "wallet") {
    // handle wallet logic
    res.send("Wallet not implemented.");
  } else {
    res.sendStatus(400);
  }
};

exports.orderdetailpage = async (req, res) => {
  try {
    const ordersOfUser = await Order.find({ userId: req.session.userId });
    let allProducts = [];

    for (let order of ordersOfUser) {
      for (let product of order.products) {
        allProducts.push({
          orderId: order._id,
          productId: product.productId,
          quantity: product.quantity,
          price: product.price,
          productName: product.productName,
          orderStatus: order.orderStatus,
          image: product.image[0],
          totalAmount:order.totalAmount,
        });
      }
    }
    allProducts=allProducts.reverse()
    // console.log(allProducts);
    res.render("user/orderdetailpage", { allProducts });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};



exports.cancelorder = async (req, res) => {
  const orderId = req.params.orderId; 
  const newStatus = 'cancelled'
  console.log(orderId);


  try {
    const updatedOrder = await Order.findByIdAndUpdate(orderId, { orderStatus: newStatus }, { new: true });
    res.redirect('/orderdetail')
    // res.json({ status: 'success', updatedOrder });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
}

 
 