const collection = require("../models/UserSchema");
const bcrypt = require("bcrypt");
const Product = require("../models/productSchema");
const Category = require("../models/CategorySchema");
const express = require("express");
const router = express.Router();
const path = require("path");
const { log } = require("console");
const Order = require('../models/orderSchema');

exports.login = async (req, res) => {
  try {
    res.render("admin/login");
  } catch (error) {
    console.log(error.message);
  }
};

exports.dashboard = async (req, res) => {
  try {
    res.render("./admin/admindashboard");
  } catch (error) {
    console.log(error.message);
  }
};

exports.userdetails = async (req, res) => {
  try {
    const admin = await collection.find({}); // Fetch all users from the database
    console.log(admin);
    res.render("admin/users", { admin });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.users = async (req, res) => {
  try {
    const admin = await collection.find({}); // Fetch all users from the database

    res.render("admin/users", { admin });
  } catch (error) {
    console.log(error.message);
  }
};

exports.loginpost = (req, res) => {
  const name = process.env.NAME;
  const password = process.env.PASSWORD;

  if (name === req.body.email && password == req.body.password) {
    req.session.admin = req.body.email;
    console.log("session created:", req.session.admin);
    res.redirect("/admin/dashboard");
  } else {
    const errorMessage = "Invalid username or password :(";
    return res.render("admin/login", { error: errorMessage });
  }
};

exports.blockUser = async (req, res) => {
  const user = await collection.findById(req.params.userId);
  if (user.isBlocked) {
    user.isBlocked = false;
  } else {
    user.isBlocked = true;
  }
  await user.save();
  res.redirect("/admin/users");
};

exports.listProducts = async (req, res) => {
  const products = await Product.find({});
  console.log("products");
  res.render("admin/listProducts", { products: products });
};

exports.getAddProduct = async (req, res) => {
  const productId = req.params.productId;
  const categories = await Category.find();
  const product = await Product.findById(productId);
  res.render("admin/addProduct", { categories , product });
};

exports.postAddProduct = async (req, res) => {
  const data = {
    productName: req.body.productName,
    productDescription: req.body.productDescription,
    category: req.body.productCategory,
    productPrice: req.body.productPrice,
    productQuantity: req.body.productQuantity,
    images: req.files.map((file) => file.path.substring(6)),
  };

  await Product.insertMany([data]).then(() => {
    console.log("inserted", data);
  });

  res.redirect("/admin/products");
};

exports.getEditProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    const category = await Category.find();

    // console.log("product is :", product);
    res.render("admin/editProduct", { product, category });
  } catch (error) {
    console.log("error");
    res.send("internal server error");
  }
};

exports.postEditProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const category = req.body.productCategory;
    const {
      productName,
      productDescription,
      productPrice,
      productQuantity,
      productCategory,
    } = req.body;

    // Check if new images are provided
    let images = req.files ? req.files.map((file) => file.path.substring(6)) : [];

    // If no new images are provided, fetch the existing images of the product
    if (images.length === 0) {
      const existingProduct = await Product.findById(productId);
      if (existingProduct) {
        images = existingProduct.images;
      }
    }

    const updateProduct = await Product.findByIdAndUpdate(
      productId,
      {
        productName,
        productDescription,
        productPrice,
        productQuantity,
        productCategory,
        category,
        images,
      },
      { new: true }
    );

    if (!updateProduct) {
      return res.status(404).send("Product not found");
    }
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    res.send("Internal server error");
  }
};


exports.deleteProductImage = async (req, res) => {
  try {
    const productId = req.params.productId;
    const index = parseInt(req.params.index);

    // Fetch the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Check if the index is valid
    if (index < 0 || index >= product.images.length) {
      return res.status(400).send('Invalid image index');
    }

    // Remove the image at the specified index
    product.images.splice(index, 1);

    // Save the updated product
    await product.save();

    res.status(200).send('Image deleted successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


exports.deleteProduct = async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      { deleted: true },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    console.log(`Soft deleted product: ${product}`);
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.listProduct = async (req, res) => {
  try {
    const id = req.params.id;
    // console.log("product id ", id);
    const product = await Product.findById({ _id: id });
    // console.log(product);
    product.listed = !product.listed;
    // console.log("listed or not", product.listed);
    await product.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    // console.log("categories");
    const categories = await Category.find();

    res.render("admin/category", { categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getaddCategory = async (req, res) => {
  res.render("admin/addCategory");
};

exports.postaddCategory = async (req, res) => {
  const name = req.body.categoryName.toLowerCase();
  console.log(req.body);

  try {
    const existingCategory = await Category.findOne({ categoryName: name });
    if (existingCategory) {
      const errorMessage = "Category already exists.";
      res.render("admin/addCategory", { message: errorMessage });
    } else {
      const newCategory = await Category.create({ categoryName: name });
      const errorMessage = "category added successfully";
      // console.log("Category added successfully:", newCategory);
      res.render("admin/addcategory", { message: errorMessage });
    }
  } catch (error) {
    console.error(error);
    const errorMessage = "Internal Server Error";
  }
};

exports.geteditCategory = async (req, res) => {
  console.log("etr the edit");
  const categoryId = req.params.id;
  const category = await Category.findOne({ _id: categoryId });
  console.log("category is", category);
  res.render("admin/editCategory", { category });
};

exports.posteditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { categoryName } = req.body;
    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory && existingCategory._id != categoryId) {
      const errorMessage ="category already exists"
      // Send the error message in the response
      return res.status(400).json({ error: "Category name already exists." })
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { categoryName },
      { new: true }
    );

    console.log(`Category ${updatedCategory.categoryName} updated successfully.`);
    res.redirect("/admin/categories");
  } catch (error) {
    console.error(error);
    // Send the error message in the response
    res.status(500).json({ error: "Internal server error." });
  }
};


exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    await Category.findByIdAndDelete(categoryId).then(() => {
      console.log(`Category deleted successfully.`);
      res.redirect("/admin/categories");
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.adminlogout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    } else {
      res.redirect("/admin/login");
    }
  });
};



exports.adminOrder = async (req, res) => {
  try {
  
    let orders = await Order.find().populate('userId').populate('addressId');
    orders=orders.reverse()
    res.render('admin/order', { orders });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  } 
};
exports.adminOrderdetail = async (req, res) => {
  try {
    
   
    const ordersOfUser = await Order.find({ _id: req.params.id });
    let allProducts = [];

    for (let order of ordersOfUser) {
      for (let product of order.products) {
        allProducts.push({
          orderId: order._id,
          productId: product.productId,
          quantity: product.quantity,
          price: product.price,
          productName: product.productName,
          orderStatus: order.orderStatus,
          image: product.image[0],
        });
      }
    }

    res.render('admin/vieworder', { allProducts });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};
exports.orderStatus = async (req, res) => {
  const orderId = req.params.orderId; 
  const newStatus = req.body.newStatus;
  console.log(newStatus);

  try {
    const updatedOrder = await Order.findByIdAndUpdate(orderId, { orderStatus: newStatus }, { new: true });
    res.json({ status: 'success', updatedOrder });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
}

  





