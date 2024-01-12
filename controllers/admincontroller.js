const collection = require("../models/UserSchema");
const bcrypt = require("bcrypt");
const Product = require("../models/productSchema");
const Category = require("../models/CategorySchema");
const express = require("express");
const router = express.Router();
const path = require("path");
const { log } = require("console");
const Order = require("../models/orderSchema");
const moment = require("moment");
const fs = require('fs');
const PDFDocument = require('pdfkit');

exports.login = async (req, res) => {
  try {
    res.render("admin/login");
  } catch (error) {
    console.log(error.message);
  }
};

exports.dashboard = async (req, res) => {
  try {
    //category bar diagram implementation
    const categoryCounts = await Order.aggregate([
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      { $group: { _id: "$productDetails.category", count: { $sum: 1 } } },
    ]);
    console.log(categoryCounts);

    const labels = categoryCounts.map((categoryCount) => categoryCount._id);
    const counts = categoryCounts.map((categoryCount) => categoryCount.count);
    console.log(labels);

    //orders per day implementation
    const today = moment().startOf("day"); // Get the start of today
    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: today.toDate() },
    });

    //total purchase amount implementation
    const startOfMonth = moment().startOf("month");
    const endOfMonth = moment().endOf("month");
    const totalRevenueThisMonth = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);
    const revenue =
      totalRevenueThisMonth.length > 0
        ? totalRevenueThisMonth[0].totalAmount
        : 0;
    const paymentOptionCounts = await Order.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
        },
      },
    ]);

    //which payment option have highest no: of orders
    const highestOrderPaymentOption = paymentOptionCounts.reduce(
      (max, current) => (current.count > max.count ? current : max),
      { count: 0 }
    );

    const paymentOptionCount = await Order.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
        },
      },
    ]);

    // Extract payment option labels and counts for the pie chart
    const pieLabels = paymentOptionCount.map(
      (paymentOption) => paymentOption._id
    );
    const pieCounts = paymentOptionCount.map(
      (paymentOption) => paymentOption.count
    );

    const highestOrderCategory = categoryCounts.reduce(
      (max, current) => (current.count > max.count ? current : max),
      { count: 0 }
    );

      // Calculate weekly order counts
      const startOfWeek = moment().startOf('week');
      const endOfWeek = moment().endOf('week');
      const dailyCounts = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() },
          },
        },
        {
          $group: {
            _id: {
              dayOfWeek: { $dayOfWeek: '$createdAt' },
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            },
            count: { $sum: 1 },
          },
        },
      ]);
      
      // Extract labels and counts for weekly
      const dailyLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dailyData = Array(7).fill(0).map(() =>0); // Initialize a 2D array for weekly counts
      
      dailyCounts.forEach((dayCount) => {
        const dayOfWeekIndex = dailyLabels.indexOf(moment(dayCount._id.date).format('dddd'));
        dailyData[dayOfWeekIndex] = dayCount.count;
      });
      
      //console.log("haiii", dailyCounts);
      //console.log("weeklyData", dailyData);
      

    console.log(dailyCounts);
    res.render("./admin/admindashboard", {
      labels,
      counts,
      ordersToday,
      revenue,
      highestOrderPaymentOption,
      pieLabels,
      pieCounts,
      highestOrderCategory,
      dailyLabels,
      dailyCounts,
      dailyData
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

exports.userdetails = async (req, res) => {
  try {
    const admin = await collection.find({});
    console.log(admin);
    res.render("admin/users", { admin });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.users = async (req, res) => {
  try {
    const admin = await collection.find({});

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
  res.render("admin/addProduct", { categories, product });
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
    let images = req.files
      ? req.files.map((file) => file.path.substring(6))
      : [];

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
      return res.status(404).send("Product not found");
    }

    // Check if the index is valid
    if (index < 0 || index >= product.images.length) {
      return res.status(400).send("Invalid image index");
    }

    // Remove the image at the specified index
    product.images.splice(index, 1);

    // Save the updated product
    await product.save();

    res.status(200).send("Image deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
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
  let category;

  try {
    console.log("Enter the edit");
    const categoryId = req.params.id;
    category = await Category.findOne({ _id: categoryId });
    console.log("Category is", category);

  } catch (error) {
    console.error(error);
    const errorMessage = "Error fetching category.";
    return res.render("admin/editCategory", { category: null, errorMessage });
  }

  const errorMessage = "";

  res.render("admin/editCategory", { category, errorMessage });
};



exports.posteditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findOne({ _id: categoryId });
    const { categoryName } = req.body;
    const existingCategory = await Category.findOne({
      categoryName: { $regex: new RegExp(`^${categoryName}$`, 'i') },
      _id: { $ne: categoryId }, 
    });

    if (existingCategory && existingCategory._id != categoryId) {
      const errorMessage = "Category name already exists.";
      // Pass the error message to the template
      return res.render("admin/editCategory", { category, errorMessage });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { categoryName },
      { new: true }
    );

    console.log(
      `Category ${updatedCategory.categoryName} updated successfully.`
    );
    res.redirect("/admin/categories");
  } catch (error) {
    console.error(error);
    // Pass the error message to the template
    res.render("admin/editCategory", { category, errorMessage: "Internal server error." });
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
    let orders = await Order.find().populate("userId").populate("addressId");
    orders = orders.reverse();
    res.render("admin/order", { orders });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
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

    res.render("admin/vieworder", { allProducts });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};
exports.orderStatus = async (req, res) => {
  const orderId = req.params.orderId;
  const newStatus = req.body.newStatus;
  console.log(newStatus);

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: newStatus },
      { new: true }
    );
    res.json({ status: "success", updatedOrder });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

exports.salesreport = async (req, res) => {
  try {
    const salesReports = await Order.find()
      .populate({
        path: "userId",
        model: "collection_1",
        select: "name",
      })
      .populate({
        path: "addressId",
        model: "Address",
        select: "name Address city pin phone",
      })
      .exec();

      console.log(salesReports);

    const formattedSalesReports = salesReports.map((order) => ({
      userId: order.userId._id,
      username: order.userId.name,
      products: order.products,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      orderDate: order.createdAt,
      address: {
        addressId: order.addressId._id,
        name: order.addressId.name,
        address: order.addressId.Address,
        city: order.addressId.city,
        pincode: order.addressId.pin,
        phone: order.addressId.phone,
      },
    }));

   // console.log("hiiiiiiiiiiii" ,formattedSalesReports);

    res.render("admin/salesreports", {
      success: true,
      salesReports: formattedSalesReports,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching sales report details" });
  }
};

exports.stockreport = async (req, res) => {
  try {
    const products = await Product.find();

    const orders = await Order.find();

    const stockReport = products.map((product) => {
      const totalQuantitySold = orders.reduce((total, order) => {
        const productInOrder = order.products.find((orderProduct) =>
          orderProduct.productId.equals(product._id)
        );
        return total + (productInOrder ? productInOrder.quantity : 0);
      }, 0);

      const stockLeft = product.productQuantity - totalQuantitySold;

      return {
        productId: product._id,
        productName: product.productName,
        productQuantity: product.productQuantity,
        stockLeft,
      };
    });

    console.log(stockReport);
    res.render("admin/stockreport", { success: true, stockReport });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching stock report details" });
  }
};
