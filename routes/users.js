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
  deleteAddress,
  changepassword,
  postchangepassword,
  
  
  
 
} = require("../controllers/usercontroller");
const  { cartcontroller,addtocartController,cartdetails,deleteCart,checkoutdetails,updQuantity,checkoutpage ,  addresses,confirmpage, placeOrder,orderdetailpage , cancelorder, } = require("../controllers/cartcontroller")
const { isAuthenticated, isBlocked } = require("../middlewares/authMiddleware");


router.get("/", home);

router.get("/login", login);

router.post("/login", loginpost);

router.get("/changepass",changepassword)

router.post("/changepass",postchangepassword)

router.get("/signup", signup);

router.post("/signup", signuppost);

//User pages
router.get("/shop", isAuthenticated, isBlocked, shoppage);

router.get("/blog", isAuthenticated, blogpage);

router.get("/about", aboutpage);

router.get("/logout", logout);

router.get("/detail/:id", detail);

//Cart Management
router.get("/cartdetails",isAuthenticated,cartdetails)

router.get("/cart/:productid",isAuthenticated,cartcontroller)

router.get("/cartremove/:productid",isAuthenticated,deleteCart)

router.put("/updateQuantity/:productId",isAuthenticated, updQuantity)

// router.post("/addTocart",addtocartController);

router.get("/userprofile",isAuthenticated,userprofile)

router.get("/checkout",isAuthenticated, checkoutpage)

router.post("/check",isAuthenticated,checkoutdetails)

router.get("/address/:addressId",isAuthenticated,geteditaddress)

router.post("/editaddress/:addressId",isAuthenticated,posteditaddress)

router.get("/addAddress",isAuthenticated,getaddAddress)

router.post("/addaddress", isAuthenticated,postaddAddress)

router.post("/order",isAuthenticated,placeOrder)

router.get("/orderdetail",isAuthenticated,orderdetailpage)

router.get("/confirm",isAuthenticated,confirmpage)

router.post("/user/orderstatus/:orderId",isAuthenticated,userorderStatus)


router.get("/useraddress", isAuthenticated,userAddress)

router.get("/deleteAddress/:addressId",isAuthenticated,deleteAddress);

router.get("/cancel/:orderId",isAuthenticated,cancelorder)
   



module.exports = router;
