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
} = require("../controllers/usercontroller");

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

module.exports = router;
