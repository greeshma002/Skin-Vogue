const { isBlocked } = require("../middlewares/authMiddleware");
const Product = require("../models/productSchema");
const collection = require("../models/UserSchema");
const address = require("../models/addressSchema");
const Order = require("../models/orderSchema");
const Wishlist = require("../models/wishlistSchema");
const Razorpay = require("razorpay");
require("dotenv").config();
const wallet = require("../models/walletSchema");
const coupon = require("../models/couponSchema");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const ejs = require("ejs");

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
  // sendOTP(email, req.session.otp);
  console.log(`${email} got the OTP for ${req.session.otp}`);
}

exports.shoppage = async (req, res) => {
  try {
    let query = { listed: true };

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const startIndex = (page - 1) * limit;

    const totalProducts = await Product.countDocuments();
    const maxPage = Math.ceil(totalProducts / limit);
    // console.log(maxPage);

    // Redirect if the requested page is greater than the maximum page
    if (page > maxPage) {
      return res.redirect(`/shop?page=${maxPage}`);
    }

    const productData = await Product.find(query)
      .limit(limit)
      .skip(startIndex)
      .exec();

    res.render("shop", { productData, page, maxPage });
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
    const email = req.session.user;
    const username = await collection.findOne({ email });
    const addresses = await address.find({ userId: username._id });

    res.render("user/userprofile", { username, addresses });
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
    res.redirect("/userprofile");
  } catch (error) {
    console.log(error);
    res.send("internal server error");
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    await address.deleteOne({ _id: addressId });
    res.redirect("/userprofile");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getwishlist = async (req, res) => {
  const email = req.session.user;

  try {
    let wishlist = await Wishlist.findOne({
      userId: req.session.userId,
    }).populate("products");

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
  try {
    const productId = req.params.productid;
    const email = req.session.user;

  
    if (!email) {
      return res.status(401).send("User not authenticated");
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }

  
    const user = await collection.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found");
    }

  
    let wishlist = await Wishlist.findOne({ userId: user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: user._id, products: [] });
    }

  
    const productIndex = wishlist.products.findIndex(
      (p) => p.productId.toString() === productId
    );

    if (productIndex > -1) {
     
      return res.redirect("/wishlist");
    } else {

      wishlist.products.push({
        productId: productId,
        productName: product.productName,
        price: product.productPrice,
        quantity: 1,
        image: product.images[0],
      });
      await wishlist.save();
    }

    return res.redirect("/wishlist");
  } catch (err) {
    console.log("greeshma" ,err);
    res.status(500).send("Something went wrong");
  }
};

exports.postrazorpay = async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const addr = req.body.address;
    console.log("hii");
    console.log(addr);
    // Razorpay
    const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
    const Razorpay = require("razorpay");
    let instance = new Razorpay({
      key_id: RAZORPAY_ID_KEY,
      key_secret: RAZORPAY_SECRET_KEY,
    });
    //RaZor Pay
    instance.orders
      .create({
        amount: amount,
        currency: "INR",
        receipt: "receipt#1",
        notes: {
          paymentMethod: "online",
          addressId: addr,
        },
      })
      .then((order) => {
        console.log(order._id);
        return res.send({ orderId: order.id });
      });
  } catch (error) {
    console.log(error);
  }
};

exports.shopsearch = async (req, res) => {
  const searchQuery = req.query.q;

  try {
    const results = await Product.find({
      productName: { $regex: new RegExp(`^${searchQuery}`, "i") },
    });

    let html = await ejs.renderFile("./views/products_template.ejs", {
      productData: results,
    });
    res.send(html);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.orderreturn = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.session.userId;

    const order = await Order.findOne({ _id: orderId, userId: userId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, error: "Order not found." });
    }
    if (order.orderStatus === "returned") {
      return res
        .status(400)
        .json({ success: false, error: "Order has already been returned." });
    }
    order.orderStatus = "returned";
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
    console.error("Error:", err);
    res
      .status(500)
      .send({ success: false, error: "An internal server error occurred." });
  }
};

exports.userwallet = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).send("Unauthorized"); // Or redirect to login page
    }

    const userWallet = await wallet.findOne({ user: userId });
    const transactions = userWallet ? userWallet.history : [];

    if (!userWallet) {
      return res
        .status(404)
        .json({ success: false, error: "Wallet not found for the user." });
    }

    res.render("user/userwallet", { amount: userWallet.balance, transactions });
  } catch (error) {
    console.error(error.message);
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

exports.postwallet = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let userWallet = await wallet.findOne({ user: userId });

    if (!userWallet) {
      userWallet = new wallet({ user: userId, balance: 0, history: [] });
      await userWallet.save();
    }

    const orderTotal = req.body.totalPrice;
    const refundedAmount = req.body.refundedAmount || 0;

    if (userWallet.balance >= orderTotal - refundedAmount) {
      console.log(userWallet.balance);
      console.log(orderTotal);

      const newTransaction = {
        amount: orderTotal,
        refunded: refundedAmount,
        type: "debit",
      };

      if (req.body.orderId) {
        newTransaction.orderId = req.body.orderId;
      }

      userWallet.balance -= orderTotal - refundedAmount;
      userWallet.history.push(newTransaction);

      if (refundedAmount > 0) {
        const creditTransaction = {
          amount: refundedAmount,
          type: "credit",
          refunded: refundedAmount, // Include refunded amount in credit transaction
        };

        if (req.body.orderId) {
          creditTransaction.orderId = req.body.orderId;
        }

        userWallet.balance += refundedAmount;
        userWallet.history.push(creditTransaction);
      }

      await userWallet.save();

      return res.json({
        success: true,
        message: "Wallet transaction successful",
      });
    } else {
      return res.json({
        success: false,
        message: "Insufficient funds in the wallet",
      });
    }
  } catch (error) {
    console.error("Error during wallet transaction:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


exports.userdetails = async (req, res) => {
  try {
    const email = req.session.user
    console.log(email);
    const user = await collection.findOne({ email })
    
    

    // Update user details based on the form data
    if (req.body.editName) {
      user.name = req.body.editName;
    }

    user.phone = req.body.editMobile;

    // Save the updated user details
    await user.save();

    res.redirect("/userprofile"); // Redirect to the user details page or any other desired page
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getOrderDetailsById = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate("addressId").exec();

    if (!order) {
      return null; // Order not found
    }

    const orderDetails = {
      orderId: order._id,
      Address: {
        name: order.addressId?.name,
        address: order.addressId?.Address,
        state: order.addressId?.state,
        pin: order.addressId?.pin,
        phone: order.addressId?.phone,
      },
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      products: order.products, // You may include other product details if needed
      // Add other fields as needed
    };

    return orderDetails;
  } catch (error) {
    console.log(error.message);
    throw error; // Handle the error according to your application's requirements
  }
};

function generateInvoice(orderDetails, res) {
  const doc = new PDFDocument();

  // Set font size for the entire document
  doc.fontSize(12);

  // Website Name
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("SKINVOGUE", { align: "center" })
    .moveDown(1);

  // Order ID
  doc.fontSize(12).text(`Order ID: ${orderDetails.orderId}`, 50, doc.y);
  doc.moveDown(); // Add some space

  // Sold by details on the left
  doc.fontSize(10).text("Sold by:", 50, doc.y);
  doc.text("EZIO", { indent: 10 });
  doc.text("Plot no. 49, Block 5, Basement Inner 2, Eros Garden", {
    indent: 20,
  });
  doc.text("Near Surajkund Road, FARIDABAD - 121009", { indent: 20 });
  doc.text("GST: 06AFRPB7420F1ZN", { indent: 20 });
  doc.moveDown(); // Add some space

  // User Selected Address on the right
  const addressDetails = [
    `Name: ${orderDetails.Address.name}`,
    `Address: ${orderDetails.Address.address}`,
    `State: ${orderDetails.Address.state}`,
    `PIN: ${orderDetails.Address.pin}`,
    `Phone: ${orderDetails.Address.phone}`,
  ];

  doc.fontSize(10).text(addressDetails, 350, 160, { align: "left" });
  doc.moveDown(); // Add some space

  // Order Summary Table
  doc
    .fontSize(16)
    .fillColor("#ff69b4")
    .text("Order Summary:", 50, doc.y + 60);
  generateOrderTable(doc, orderDetails.products);

  // Total Amount, Payment Method, and Order Status
  doc.moveDown(); // Add some space
  doc.fillColor("#ff69b4").text(`Total Amount: ${orderDetails.totalAmount}`);
  doc.text(`Payment Method: ${orderDetails.paymentMethod}`);
  doc.text(`Order Status: ${orderDetails.orderStatus}`);

  // Pipe the document to the response
  doc.pipe(res);
  doc.end();
  return doc
}

function generateOrderTable(doc, products) {
  // Table Header
  const tableHeader = ["Product Name", "Quantity", "Price"];
  generateTableRow(doc, tableHeader, {
    fontSize: 12,
    bold: true,
    backgroundColor: "#ff69b4",
    color: "white",
  });
  doc.moveDown(); // Add some space

  // Table Rows
  products.forEach((product) => {
    const rowData = [
      product.productName,
      product.quantity.toString(),
      product.price.toString(),
    ];
    generateTableRow(doc, rowData, {
      backgroundColor: "white",
      color: "black",
    });
    doc.moveDown(); // Add some space
  });
}

function generateTableRow(doc, rowData, options = {}) {
  const {
    fontSize = 12,
    bold = false,
    align = "center", // Changed alignment to center
    cellPadding = 10,
    backgroundColor = null,
    color = null,
  } = options;

  doc.fontSize(fontSize);
  if (bold) {
    doc.font("Helvetica-Bold");
  }

  rowData.forEach((cell, index) => {
    const xPosition = 50 + index * 150; // Adjust the starting position based on your layout
    const yPosition = doc.y;
    const width = 150;
    const height = fontSize + cellPadding * 2;

    // Draw cell background if specified
    if (backgroundColor) {
      doc.rect(xPosition, yPosition, width, height).fill(backgroundColor);
    }

    // Draw cell content
    doc
      .fillColor(color || "black")
      .text(cell, xPosition, yPosition, {
        align,
        width: width - cellPadding * 2,
      });

    // Draw cell border
    doc.rect(xPosition, yPosition, width, height).stroke();
  });

  doc.moveDown(); // Add some space

  // Reset font and fill color to default
  doc.font("Helvetica").fillColor("black");
}

// Example Usage:
// Assume orderDetails is obtained using getOrderDetailsById function
// const orderDetails = getOrderDetailsById('your-order-id');
// generateInvoice(orderDetails, response);

exports.invoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const orderDetails = await getOrderDetailsById(orderId);
    console.log(JSON.stringify(orderDetails));
  
    if (orderDetails) {
      const invoicePath = generateInvoice(orderDetails, res);
      console.log("Generating invoice for:", orderDetails);
      const fileStream = fs.createReadStream(invoicePath);
      fileStream.pipe(res);
       fs.unlinkSync(invoicePath);
    } else {
      res.status(404).send("Order not found");
    }
  } catch (error) {
    console.log(error);
  }
  // Assume you have a function to get order details based on the order ID
 
};
