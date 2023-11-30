const express = require("express");
const router = express.Router();

const {
  signuppost,
  signup,
  login,
  home,
  loginpost,
  shoppage,
  blogpage,
  aboutpage,
  logout,
  detail,
  userprofile,
  
 
} = require("../controllers/usercontroller");
const  { cartcontroller,addtocartController,cartdetails } = require("../controllers/cartcontroller")
const { isAuthenticated, isBlocked } = require("../middlewares/authMiddleware");

router.get("/", home);

router.get("/login", login);

router.post("/login", loginpost);

router.get("/signup", signup);

router.post("/signup", signuppost);

//User pages
router.get("/shop", isAuthenticated, isBlocked, shoppage);

router.get("/blog", isAuthenticated, blogpage);

router.get("/about", aboutpage);

router.get("/logout", logout);

router.get("/detail/:id", detail);

//Cart Management
router.get("/cartdetails",cartdetails)
router.get("/cart/:productid",cartcontroller)
// router.post("/addTocart",addtocartController);

router.get("/userprofile",userprofile)

module.exports = router;
