const Product = require("../models/Product");
const collection = require("../models/mongodb");

const { sendOTP, generateOTP } = require("../utils/mailing");

const bcrypt = require('bcrypt');

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
      isBlocked === true;
      res.redirect('/')
    } else {
      res.render('./user/login')
    }
  } catch (error) {
    console.log(error.message);
  }
};

exports.signup = async (req, res) => {
  try {
    if (req.session.user) {
      res.redirect('/');
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
      } else {
        const passwordMatch = await bcrypt.compare(req.body.password, check.password);

        if (passwordMatch) {
          req.session.user = check.email;
          console.log("Session is:", req.session.user);
          res.render("index");
        } else {
          const errorMessage = "Wrong Password...!!!";
          res.render("user/login", { message: errorMessage });
        }
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

exports.UserGet = async (req, res) => {
  const admin = await UserCollection.find();
  res.render("Admin/Users", { admin });
};

exports.signuppost = async (req, res) => {
  console.log('enter the signup');
  try {
    
    const check = await collection.findOne({ email: req.body.email });
     
    if (check) {
        if (check.isVerified) {
            res.send("An account already exists.");
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
    name: req.body.name,
    email: req.body.email,
    password: await bcrypt.hash(req.body.password, 10),
    isVerified: false,
  };

  req.session.email = req.body.email;

  await collection.create(data);
  // res.render("index");

  // Generate an OTP and put it in user session.
  req.session.otp = generateOTP();
  const now = new Date();
  // Save an expiry time for the OTP in the session as well.
  req.session.otpExpiry = now.getTime() + 3 * 60 * 1000;
 // sendOTP(req.body.email, req.session.otp);
  console.log(`${req.body.email} got the OTP for ${req.session.otp}`);
  res.render('user/otp');
  } catch (error) {
    console.log(error );
  }
};

// exports.listProducts = async (req, res) => {
//   await Product.find({});
//   res.render("user/products")
// }

exports.shoppage = async (req, res) => {
  try {
    const productData = await Product.find({listed:true});
    console.log(productData);
    res.render("shop", { productData });
  } catch (error) {
    console.log(error.message);
    // Handle the error, perhaps by rendering an error page
    res.render("error", { errorMessage: "An error occurred" });
  }
};


exports.blogpage = async (req, res) => {
  try {
    res.render("blog")
  } catch (error) {
    console.log(error.message);
  }
};

exports.aboutpage = async (req, res) => {
  try {
    res.render("about")
  } catch (error) {
    console.log(error.message);
  }
};

exports.logout = async (req, res) => {
  req.session.destroy(err => {
      if (err) {
          console.error('Error destroying session:', err);
      } else {
          res.render('user/login'); // Redirect to the login page or any other desired page
      }
  });
}
exports.detail = async (req, res) => {
  try {
    const id=req.params.id
    const productDetails=await Product.findById(id)
    res.render('user/detailspage',{product:productDetails})
  } catch (error) {
    console.log(error);
  }
}
