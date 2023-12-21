const Coupon = require("../models/couponSchema");

exports.addcoupon = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.render("admin/coupon", { coupons });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};

exports.addnewcoupon = async (req, res) => {
  try {


    const newCoupon = new Coupon({
      couponCode: req.body.couponCode,
      discountPercentage: req.body.discountPercentage,
      minValue: req.body.minvalue,
      maxValue: req.body.maxvalue,
      expirationDate: req.body.expirationDate
    });
    console.log((req.body));

    await newCoupon.save(); // Save the new coupon to the database
    res.redirect('/admin/coupon'); // Redirect to the page with the updated list
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};



