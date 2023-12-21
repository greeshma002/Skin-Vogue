const { isBlocked } = require("../middlewares/authMiddleware");
const Product = require("../models/productSchema");
const collection = require("../models/UserSchema");
const address = require("../models/addressSchema");
const Order = require("../models/orderSchema");
const Wishlist = require("../models/wishlistSchema");
const Razorpay = require("razorpay")
require("dotenv").config();
const wallet = require("../models/walletSchema")
const coupon = require("../models/couponSchema")

const ejs = require('ejs');

const { sendOTP, generateOTP } = require("../utils/mailing");
const { addAddress } = require("../models/addressSchema");

const bcrypt = require("bcrypt");

exports.home = async (req, res) => {
  try {
    res.render("index");
  } catch (error) {
    console.log(error.message);
  }
};

exports.login = async (req, res) => {
  try {
    if (req.session.user) {
      res.redirect("/");
    } else {
      res.render("user/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

exports.signup = async (req, res) => {
  try {
    if (req.session.user) {
      res.redirect("/");
    } else {
      res.render("./user/signup");
    }
  } catch (error) {
    console.log(error.message);
  }
};

exports.loginpost = async (req, res) => {
  try {
    const check = await collection.findOne({ email: req.body.email });
    if (!check) {
      const errorMessage = "User not found. Please register";
      res.render("user/login", { message: errorMessage });
      return;
    }
    if (check.isVerified) {
      if (check.isBlocked) {
        const errorMessage = "You are blocked";
        res.render("user/login", { message: errorMessage });
      } else if (await bcrypt.compare(req.body.password, check.password)) {
        req.session.user = check.email;
        req.session.userId = check._id;
        req.session.userDoc = check.isBlocked;
        console.log("session is:", req.session.user);
        res.render("index");
      } else {
        const errorMessage = "Wrong Password...!!!";
        res.render("user/login", { message: errorMessage });
      }
    } else {
      const errorMessage = "Your email is not verified. Register again.";
      res.render("user/login", { message: errorMessage });
    }
  } catch (err) {
    res.send("An internal server error occurred.");
    console.error(err);
  }
};

exports.changepassword = async (req, res) => {
  try {
    res.render("user/changepassword");
  } catch (error) {
    console.log(error.message);
  }
};

exports.postchangepassword = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .render("user/changepassword", { error: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).render("user/changepassword", {
        error: "New password and confirmation password do not match",
      });
    }

    const user = await collection.findOne({ _id: userId });

    if (!user) {
      return res
        .status(404)
        .render("user/changepassword", { error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .render("user/changepassword", { error: "Invalid old password" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await collection.updateOne(
      { _id: userId },
      { $set: { password: hashedNewPassword } }
    );

    return res.status(200).render("user/changepassword", {
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .render("user/changepassword", { error: "Internal server error" });
  }
};

exports.signuppost = async (req, res) => {
  console.log("enter the signup");
  try {
    const check = await collection.findOne({ email: req.body.email });

    if (check) {
      if (check.isVerified) {
        const errorMessage = "An account already exists.";
        res.render("user/signup", { message: errorMessage });
        return;
      } else {
        try {
          await collection.findOneAndDelete({ email: req.body.email });
        } catch (err) {
          console.error(err);
        }
      }
    }

    const data = {
      name: req.body.name.trim(),
      email: req.body.email,
      password: await bcrypt.hash(req.body.password, 10),
      isVerified: false,
    };

    req.session.email = req.body.email;

    await collection.create(data);
    // res.render("index");
    sendMailfn(req, res, req.body.email);
    res.render("user/otp", { email: req.body.email });
  } catch (error) {
    console.log(error);
  }
};

function sendMailfn(req, res, email) {
  req.session.otp = generateOTP();
  const now = new Date();
  req.session.otpExpiry = now.getTime() + 3 * 60 * 1000;
  sendOTP(email, req.session.otp);
  console.log(`${email} got the OTP for ${req.session.otp}`);
}

exports.shoppage = async (req, res) => {
  try {
    let query = { listed: true };

    // Check if a price filter is provided
    if (req.query.sort === 'lowToHigh') {
      // Sorting by price from low to high
      query = { ...query, sort: { price: 1 } };
    } else if (req.query.sort === 'highToLow') {
      // Sorting by price from high to low
      query = { ...query, sort: { price: -1 } };
    }

    const productData = await Product.find(query);

    res.render("shop", { productData });
  } catch (error) {
    console.log(error.message);
    res.render("error", { errorMessage: "An error occurred" });
  }
};

exports.blogpage = async (req, res) => {
  try {
    res.render("blog");
  } catch (error) {
    console.log(error.message);
  }
};

exports.aboutpage = async (req, res) => {
  try {
    res.render("about");
  } catch (error) {
    console.log(error.message);
  }
};

exports.logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    } else {
      res.redirect("/login");
    }
  });
};
exports.detail = async (req, res) => {
  try {
    const id = req.params.id;
    const productDetails = await Product.findById(id);
    res.render("user/detailspage", { product: productDetails });
  } catch (error) {
    console.log(error);
  }
};
exports.userprofile = async (req, res) => {
  try {
    let email = req.session.user;
    const username = await collection.findOne({ email });
    res.render("user/userprofile", { username });
  } catch (error) {
    console.log(error.message);
  }
};
exports.getaddAddress = async (req, res) => {
  try {
    res.render("user/userprofile");
  } catch (error) {
    console.log(error.message);
  }
};
exports.postaddAddress = async (req, res) => {
  try {
    const email = req.session.user;
    const username = await collection.findOne({ email });
    const newAddress = new address({
      userId: username._id,
      name: req.body.name,
      Address: req.body.Address,
      city: req.body.city,
      state: req.body.state,
      pin: req.body.pin,
      phone: req.body.phone,
    });

    await newAddress.save();

    res.redirect("/userprofile");
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
};
exports.userorderStatus = async (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = req.body.newStatus;
  console.log(newStatus);

  try {
    const updatedOrder = await Order.findById(
      orderId,
      { orderStatus: newStatus },
      { upsert: true }
    );
    res.json({ status: "success", updatedOrder });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};
exports.userAddress = async (req, res) => {
  try {
    const email = req.session.user;
    const username = await collection.findOne({ email });
    const addresses = await address.find({ userId: username._id });

    res.render("user/addressmanagement", { addresses }); // Assuming you have an EJS file named 'manage-addresses.ejs'
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
};
exports.geteditaddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const userId = req.session.userId;
    const existingAddress = await address.findById(addressId);
    const existingUserId = await collection.findById(userId);
    console.log(existingAddress);
    if (!existingAddress) {
      return res.status(404).send("Address not found");
    }

    res.render("user/addresspage", { existingAddress, existingUserId });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

exports.posteditaddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const userId = req.session.userId;
    const { name, email, Address, city, state, pin, phone } = req.body;
    console.log(addressId);
    const updatedaddress = await address.findByIdAndUpdate(
      addressId,

      {
        name,
        email,
        Address,
        city,
        state,
        pin,
        phone,
      },
      { new: true }
    );
    if (!updatedaddress) {
      return res.status(404).send("Product not found");
    }
    res.redirect("/userAddress");
  } catch (error) {
    console.log(error);
    res.send("internal server error");
  }
};
exports.deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    await address.deleteOne({ _id: addressId });
    res.redirect("/userAddress");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getwishlist = async (req, res) => {
  const email = req.session.user;

  try {
    let wishlist = await Wishlist.findOne({ userId : req.session.userId }).populate("products");

    if (wishlist) {
      console.log("Wishlist retrieved:", wishlist);
      res.render("user/wishlist", { wishlist });
    } else {
      console.log("No wishlist for user");
      res.render("user/wishlist", { wishlist });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong");
  }
};

exports.postwishlist = async (req, res) => {
  const productid = req.params.productid;
  let email = req.session.user;
  console.log(email);

  const productId = await Product.findById({ _id: productid });
  const username = await collection.findOne({ email });

  try {
    let wishlist = await Wishlist.findOne({ userId: username._id });

    if (wishlist) {
      let productIndex = wishlist.products.findIndex(
        (p) => p.productId.toString() === productid
      );

      
  if (productIndex > -1) {
    // product already exists in the wishlist, do nothing
    console.log("Product already in wishlist");
    return res.redirect('/wishlist');
  } else {
    // product does not exist in wishlist, add new product
    wishlist.products.push({
      productId: productid,
      productName: productId.productName,
      price: productId.productPrice,
      quantity: 1,
      image: productId.images[0],
    });

    wishlist = await wishlist.save();
    console.log("Product added to wishlist:", wishlist);
    return res.redirect('/wishlist');
  }
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong");
  }
};

exports.postrazorpay = async (req, res) => {
  try {

    

      const amount = Number(req.body.amount)
      const addr=req.body.address
      console.log("hii");
      console.log(addr);
      // Razorpay
      const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env
      const Razorpay = require('razorpay')
      let instance = new Razorpay({ key_id: RAZORPAY_ID_KEY, key_secret: RAZORPAY_SECRET_KEY })
      //RaZor Pay
      instance.orders.create({
          amount: amount  ,
          currency: "INR",
          receipt: "receipt#1",
          notes: {
            paymentMethod:"online", 
            addressId: addr
          }
      }).then(order => {
        console.log(order._id);
          return res.send({ orderId: order.id })
      })


  } catch (error) {
      console.log(error);
  }
}

exports.shopsearch =  async (req, res) => {
  const searchQuery = req.query.q;

  try {
      const results = await Product.find({  productName: { $regex: new RegExp(`^${searchQuery}`, 'i') }  });

      let html = await ejs.renderFile('./views/products_template.ejs', { productData: results });
      res.send(html);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.orderreturn = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.session.userId;

    const order = await Order.findOne({ _id: orderId, userId: userId });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }
    if (order.orderStatus === 'returned') {
      return res.status(400).json({ success: false, error: 'Order has already been returned.' });
    }
    order.orderStatus = 'returned';
    await order.save();

    for (let orderedProduct of order.products) {
      const actualProduct = await Product.findById(orderedProduct.productId);
      // Increase stock of actualProduct by quantity returned from order.
      actualProduct.quantity += orderedProduct.quantity;
      await actualProduct.save();
    }

    let userWallet = await wallet.findOne({ user: userId });

    if (!userWallet) {
      // If the user doesn't have a wallet, create a new one
      userWallet = new wallet({ user: userId, balance: 0 });
      await userWallet.save();
    }

    userWallet.balance += order.totalAmount;
    await userWallet.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send({ success: false, error: 'An internal server error occurred.' });
  }
};




exports.userwallet = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userWallet = await wallet.findOne({ user: userId });
   

    if (!userWallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found for the user.' });
    }

    res.render('user/userwallet', { amount: userWallet.balance });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};

// exports.orderhistory =  async (userId, amount, type, description) => {
//   try {
//     const walletHistory = new wallet({
//       user: userId,
//       amount: amount,
//       type: type,
//       description: description,
//     });

//     await walletHistory.save();
//   } catch (error) {
//     console.error('Error adding wallet history:', error);
//   }
// };
 
 