const express = require("express");
const router = express.Router();



const {
  signuppost,
  signup,
  login,
  home,
  loginpost,
  shoppage,
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
  getwishlist,
  postwishlist,
  postrazorpay,
  shopsearch,
  userwallet,
  orderreturn,
  orderhistory,
  postwallet,
  userdetails,
  invoice,
  deletewishlist,
  walletpayment,
  successwallet
 
 
} = require("../controllers/usercontroller");

const  { cartcontroller,addtocartController,cartdetails,deleteCart,checkoutdetails,updQuantity,checkoutpage ,  addresses,confirmpage, placeOrder,orderdetailpage ,uservieworder, cancelorder, } = require("../controllers/cartcontroller")

const { isAuthenticated, isBlocked } = require("../middlewares/authMiddleware");

const { applyCoupon } = require("../controllers/couponcontroller");


router.get("/", home);

router.get("/login", login);

router.post("/login", loginpost);

router.get("/changepass", changepassword)

router.post("/changepass",postchangepassword)

router.get("/signup", signup);

router.post("/signup", signuppost);

//User pages
router.get("/shop", isAuthenticated, isBlocked, shoppage);

router.get("/about",isAuthenticated,isBlocked, aboutpage);

router.get("/logout", logout);

router.get("/detail/:id",isAuthenticated,isBlocked, detail);

//Cart Management
router.get("/cartdetails",isAuthenticated,isBlocked,cartdetails)

router.get("/cart/:productid",isAuthenticated,isBlocked,cartcontroller)

router.get("/cartremove/:productid",isAuthenticated,isBlocked,deleteCart)

router.put("/updateQuantity/:productId",isAuthenticated,isBlocked, updQuantity)

router.get("/userprofile",isAuthenticated, isBlocked,userprofile)

router.get("/checkout",isAuthenticated,isBlocked, checkoutpage)

router.post("/check",isAuthenticated,isBlocked,checkoutdetails)

router.post("/usersdetails",isAuthenticated,isBlocked, userdetails);

router.get("/address/:addressId",isAuthenticated,isBlocked,geteditaddress)

router.post("/editaddress/:addressId",isAuthenticated,isBlocked,posteditaddress)

router.get("/addAddress",isAuthenticated,isBlocked,getaddAddress)

router.post("/addaddress", isAuthenticated,isBlocked,postaddAddress)

router.post("/order",isAuthenticated,isBlocked,placeOrder)

 router.get("/orderdetail",isAuthenticated,isBlocked,orderdetailpage)

router.get("/vieworder/:id",isAuthenticated,isBlocked, uservieworder)

router.get("/confirm",isAuthenticated,isBlocked,confirmpage)

router.post("/user/orderstatus/:orderId",isAuthenticated,isBlocked,userorderStatus)

router.get("/useraddress", isAuthenticated,isBlocked,userAddress)

router.get("/deleteAddress/:addressId",isAuthenticated,isBlocked,deleteAddress);

router.get("/cancel/:orderId",isAuthenticated,isBlocked,cancelorder)

router.get("/wishlist",isAuthenticated,isBlocked,getwishlist) 

router.get("/wishlist/add/:productid",isAuthenticated,isBlocked,postwishlist)

router.get("/removewish/:productid",isAuthenticated,isBlocked,deletewishlist)

router.post("/razorpay",isAuthenticated,isBlocked,postrazorpay)

router.get("/search",isAuthenticated,isBlocked,shopsearch)

router.get("/wallet",isAuthenticated,isBlocked,userwallet)

router.post("/walletpay",isAuthenticated,isBlocked,postwallet)

router.post("/walletrazorpay" , walletpayment)

 router.post("/successpay" , successwallet)

router.post("/return/:orderId",isAuthenticated,isBlocked,orderreturn)

router.post("/applyCoupon",isAuthenticated,isBlocked,applyCoupon)

router.get("/downloadinvoice/:orderId",isAuthenticated,isBlocked,invoice)


module.exports = router;
