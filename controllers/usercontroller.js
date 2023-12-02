const { isBlocked } = require("../middlewares/authMiddleware");
const Product = require("../models/productSchema");
const collection = require("../models/UserSchema");

const { sendOTP, generateOTP } = require("../utils/mailing");

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
    res.render("user/userprofile");
  } catch (error) {
    console.log(error.message);
  }
};