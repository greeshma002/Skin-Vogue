const express = require("express");
const router = express.Router();
const path = require("path");

const {
  userdetails,
  blockUser,
  users,
  loginpost,
  dashboard,
  login,
  listProducts,
  getAddProduct,
  postAddProduct,
  postEditProduct,
  deleteProduct,
  getEditProduct,
  fileUpload,
  listProduct,
  getAllCategories,
  getaddCategory,
  postaddCategory,
  geteditCategory,
  //  posteditCategory,
  deleteCategory,
  posteditCategory,
} = require("../controllers/admincontroller");

const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage }).array('img',4);

function checkSession(req,res,next){
  if (req.session.admin) {
    next()
  } else {
    res.render("admin/login");
  }
}

router.get("/login", login);
router.post("/login", loginpost);
router.get("/dashboard",dashboard);
router.get("/users",users);
router.get("/userdetails", userdetails);

router.get("/blockUser/:userId", blockUser);

// Product Management
router.get("/products", listProducts); // render list of products, admin/products.ejs

router.get("/addProduct", getAddProduct); // render add product page, admin/addProduct.ejs
router.post("/addProduct", upload, postAddProduct);

router.get("/editProduct/:productId", getEditProduct); // render edit product page, admin/editProduct.ejs
router.post("/editProduct/:id", postEditProduct);

router.get("/products/:productId", deleteProduct);
router.get("/listProduct/:id", listProduct);

router.get("/categories", getAllCategories);
router.get("/categories/add", getaddCategory);
router.post("/categories/add", postaddCategory);
//router.get("/editCategory", geteditCategory);
 router.get("/categories/edit/:id", geteditCategory);
 router.post("/categories/edit/:id", posteditCategory);
 router.post('/categories/delete/:id', deleteCategory);

//file upload using multer

module.exports = router;
