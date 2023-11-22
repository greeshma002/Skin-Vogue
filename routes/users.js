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
  detail
//   listProducts
} = require("../controllers/usercontroller");

function checkSession(req,res,next){
  if (req.session.user) {
    next()
  } else {
    res.render("/login");
  }
}

router.get("/", home);
router.get("/login", login);
router.post("/login", loginpost);
router.get("/signup", signup);
router.post("/signup", signuppost);
router.get("/shop",shoppage)
router.get("/blog",blogpage)
router.get("/about",aboutpage)
router.get("/logout",logout)
router.get("/detail/:id",detail)

// router.get("/products", listProducts);





module.exports = router;
