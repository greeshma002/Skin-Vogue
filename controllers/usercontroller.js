const { isBlocked } = require("../middlewares/authMiddleware");
const Product = require("../models/productSchema");
const collection = require("../models/UserSchema");
const address = require("../models/addressSchema")
const Order = require('../models/orderSchema')

const { sendOTP, generateOTP } = require("../utils/mailing");
const { addAddress } = require("../models/addressSchema")

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

exports.changepassword = async (req,res) => {
  try {
    res.render ("user/changepassword")
  } catch (error) {
    console.log(error.message);
  }
}

exports.postchangepassword = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).render('user/changepassword', { error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).render('user/changepassword', { error: 'New password and confirmation password do not match' });
    }

    const user = await collection.findOne({ _id: userId });

    if (!user) {
      return res.status(404).render('user/changepassword', { error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).render('user/changepassword', { error: 'Invalid old password' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await collection.updateOne({ _id: userId }, { $set: { password: hashedNewPassword } });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).render('user/changepassword', { error: 'Internal server error' });
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
    const productData = await Product.find({ listed: true });
    // conso  le.log(productData);
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
    let email = req.session.user
    const username = await collection.findOne({ email });
    res.render("user/userprofile", {username});
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

    
    res.redirect('/userprofile');
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}; 
exports.userorderStatus = async (req, res) => {
  const orderId = req.params.orderId; 
  const newStatus = req.body.newStatus;
  console.log(newStatus);

  try {
    const updatedOrder = await Order.findById(orderId, { orderStatus: newStatus } ,{upsert: true});
    res.json({ status: 'success', updatedOrder });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
}
exports.userAddress = async (req, res) => {
  try {
    const email = req.session.user;
    const username = await collection.findOne({ email });
    const addresses = await address.find({ userId: username._id });

    res.render('user/addressmanagement', { addresses }); // Assuming you have an EJS file named 'manage-addresses.ejs'
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
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
    await address.deleteOne({_id: addressId});
    res.redirect("/userAddress");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};















// exports.orderdetailpage = async (req,res) => {
//   try{
//     res.render("user/orderdetailpage")
//   }catch(error) {
//   console.log(error.message);
// }
// }; 
