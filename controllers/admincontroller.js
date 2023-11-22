const collection = require("../models/mongodb");
const bcrypt = require("bcrypt");
const Product = require("../models/Product");
const Category = require("../models/CategorySchema");
const express = require("express");
const router = express.Router();
const path = require("path");
const { log } = require("console");

exports.login = async (req, res) => {
  try {
    if (req.session.admin) {
      res.redirect("admin/dashboard");
    } else {
      res.render("admin/login");
    }
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
  const categories = await Category.find();
  res.render("admin/addProduct", { categories });
};

exports.postAddProduct = async (req, res) => {
 
  const data = {
    productName: req.body.productName,
    productDescription: req.body.productDescription,
    category: req.body.productCategory,
    productPrice: req.body.productPrice,
    productQuantity: req.body.productQuantity,
    images: req.files.map(file => file.path.substring(6))
  };

  // await Product.create({
  //   productName,
  //   productDescription,
  //   category,
  //   productPrice,
  //   productQuantity,
  //   images,
  // });
  await Product.insertMany([data]).then(() => {
    console.log("inserted", data);
  });
  // console.log(req.body);
  // const newProduct = new Product({productName,productDescription,category,productPrice,productQuantity})
  // await newProduct.save()
  res.redirect("/admin/products");
};

exports.getEditProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    const category = await Category.find();

    console.log("product is :", product);
    res.render("admin/editProduct", { product, category });
  } catch (error) {
    console.log("error");
    res.send("internal server error");
  }
};

// exports.postEditProduct = async (req, res) => {
//   console.log(req.body);
//   const { productName, productDescription, productPrice, productQuantity, productCategory  } =
//     req.body;

//   // const { name, description, category, price, quantity } = req.body;
//   const newdata = {
//     productName: productName,
//     productDescription: productDescription,
//     productPrice: productPrice,
//     productQuantity: productQuantity,
//     category: productCategory,
//   };

//   console.log("new data:", newdata);
//   const productId = req.params.productId;
//   console.log(productId);
//   await Product.findByIdAndUpdate(productId, newdata).then(
//     (x) => {
//       console.log("updated " + x);
//     }
//   );
//   // productName = name;
//   // productDescription = description;
//   // productCategory = category;
//   // productPrice = price;
//   // productQuantity = quantity;
//   // await product.save();
//   // console.log(req.body);
//   res.redirect("/admin/products");
// };

exports.postEditProduct = async (req, res) => {
  try {
    console.log(req.body);
    const productId = req.params.id;
    const category = req.body.productCategory;
    const {
      productName,
      productDescription,
      productPrice,
      productQuantity,
      productCategory,
    } = req.body;

    // const { name, description, category, price, quantity } = req.body;
    const updateProduct = await Product.findByIdAndUpdate(
      productId,
      {
        productName,
        productDescription,
        productPrice,
        productQuantity,
        productCategory,
        category,
      },
      { new: true }
    );

    if (!updateProduct) {
      return res.status(404).send("Product not found");
    }
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    res.send("internal server error");
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

// exports.listProduct = async (req, res) => {
//   const product = await collection.findById(req.params.userId);
//   if (product.listed) {
//     product.listed = false;
//   } else {
//     product.listed = true;
//   }
//   await product.save();
//   res.redirect("/admin/products");
// };

exports.listProduct = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("product id ", id);
    const product = await Product.findById({ _id: id });
    console.log(product);

    // if (!product) {
    //   return res.status(404).json({ error: 'Product not found' });
    // }
    product.listed = !product.listed;
    console.log("listed or not", product.listed);
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
  const name = req.body.categoryName;
  console.log(req.body);

  try {
    // Check if category with the same name already exists
    const existingCategory = await Category.findOne({ categoryName: name });

    if (existingCategory) {
      const errorMessage = "Category already exists.";
      res.render("admin/addCategory", { message:errorMessage });
      // console.log(`Category ${name} already exists.`);
      // res.status(400).json({ error: "Category already exists" });
    } else {
      // Category does not exist, proceed with insertion
      const newCategory = await Category.create({ categoryName:name });
      const errorMessage = "category added successfully"
      console.log("Category added successfully:", newCategory);
      res.render("admin/addcategory", { message:errorMessage });
    }
  } catch (error) {
    console.error(error);
    const errorMessage = "Internal Server Error";
    // res.render("addCategory", { errorMessage:"" });
  }
};


exports.geteditCategory = async (req, res) => {
  console.log("etr the edit");
  const categoryId = req.params.id; // Assuming you have the category ID in the URL
  const category = await Category.findOne({ _id: categoryId });
  console.log("category is", category);
  res.render("admin/editCategory", { category });
};

exports.posteditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const categoryName = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      categoryName
    );
    console.log(
      `Category ${updatedCategory.categoryName} updated successfully.`
    );
    res.redirect("/admin/categories");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
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
