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
  addAddress,
  getaddAddress,
  postaddAddress,
  userorderStatus,
  userAddress,
  postuseraddress,
  geteditaddress,
  posteditaddress,
  deleteAddress
  
  
  
 
} = require("../controllers/usercontroller");
const  { cartcontroller,addtocartController,cartdetails,deleteCart,checkoutdetails,updQuantity,checkoutpage ,  addresses,confirmpage, placeOrder,orderdetailpage } = require("../controllers/cartcontroller")
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
router.get("/cartremove/:productid",deleteCart)
router.put("/updateQuantity/:productId", updQuantity)

// router.post("/addTocart",addtocartController);

router.get("/userprofile",isAuthenticated,userprofile)
router.get("/checkout", checkoutpage)
router.post("/check",checkoutdetails)

router.get("/address/:addressId",geteditaddress)
router.post("/editaddress/:addressId",posteditaddress)
router.get("/addAddress",getaddAddress)
router.post("/addaddress", postaddAddress)

router.post("/order",placeOrder)
router.get("/orderdetail",orderdetailpage)

router.get("/confirm",confirmpage)

router.post("/user/orderstatus/:orderId",isAuthenticated,userorderStatus)


router.get("/useraddress", userAddress)
router.post("/deleteAddress/:addressId", deleteAddress);




module.exports = router;
