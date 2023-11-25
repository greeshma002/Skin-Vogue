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
  deleteCategory,
  posteditCategory,
  adminlogout,
} = require("../controllers/admincontroller");



const multer = require("multer");
const { isAdmin, isLogout } = require("../middlewares/authMiddleware");
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
const upload = multer({ storage: storage }).array('img',5);



router.get("/login",isLogout, login);

router.post("/login", loginpost);

router.get("/dashboard",isAdmin,dashboard);

router.get("/users",isAdmin,users);

router.get("/userdetails",isAdmin, userdetails);

router.get("/adminlogout",isAdmin,adminlogout)

router.get("/blockUser/:userId",isAdmin, blockUser);



// Product Management

router.get("/products", isAdmin,listProducts); 

router.get("/addProduct",isAdmin, getAddProduct); 

router.post("/addProduct",isAdmin, upload, postAddProduct);

router.get("/editProduct/:productId",isAdmin, getEditProduct); 

router.post("/editProduct/:id",isAdmin, postEditProduct);

router.get("/products/:productId",isAdmin, deleteProduct);

router.get("/listProduct/:id",isAdmin, listProduct);

//Category management

router.get("/categories",isAdmin, getAllCategories);

router.get("/categories/add",isAdmin, getaddCategory);

router.post("/categories/add",isAdmin, postaddCategory);

 router.get("/categories/edit/:id",isAdmin,geteditCategory);

 router.post("/categories/edit/:id",isAdmin, posteditCategory);

 router.post('/categories/delete/:id',isAdmin, deleteCategory);





module.exports = router;
