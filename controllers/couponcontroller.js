const Coupon = require("../models/couponSchema");
const Cart = require("../models/cartSchema");
const Swal = require('sweetalert2');


exports.addcoupon = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.render("admin/coupon", { coupons });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

exports.addnewcoupon = async (req, res) => {
  try {
    const newCoupon = new Coupon({
      couponCode: req.body.couponCode,
      discountPercentage: req.body.discountPercentage,
      minValue: req.body.minvalue,
      maxValue: req.body.maxvalue,
      expirationDate: req.body.expirationDate,
    });
    console.log(req.body);

    await newCoupon.save(); // Save the new coupon to the database
    res.redirect("/admin/coupon"); // Redirect to the page with the updated list
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

function calculateTotalPrice(cartdata) {
  if (!cartdata || !cartdata.product || cartdata.product.length === 0) {
    return 0;
  }

  return cartdata.product.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );
}
function updateCartWithDiscountedPrice(cart, discountedPrice) {
  cart.forEach((item) => {
    item.price = applyDiscount(item.price, discountedPrice);
  });
  const updatedTotalPrice = calculateTotalPrice(cart);
  return { updatedCart: cart, updatedTotalPrice };
}



exports.applyCoupon = async (req, res) => {
  try {
    const selectedCouponCode = req.body.selectedCoupon;
    const cartData = await Cart.findOne({ userId: req.session.userId });
    

    if (!selectedCouponCode) {
      return res.redirect("/cartdetails");
    }

    const selectedCoupon = await Coupon.findOne({
      couponCode: selectedCouponCode,
    });

    if (!selectedCoupon) {
      return res.redirect("/cartdetails");
    }

    const discountPercentage = selectedCoupon.discountPercentage;
    const minValue = selectedCoupon.minValue;
    const maxValue = selectedCoupon.maxValue;

    const totalPrice = calculateTotalPrice(cartData);
    

    console.log("Before applying coupon:", totalPrice);

    if (totalPrice < minValue || totalPrice > maxValue) {
      return res.status(400).send("Coupon is not applicable for this purchase");
    }

    const discountedPrice = totalPrice - (totalPrice * discountPercentage) / 100;

    console.log("After applying coupon:", discountedPrice);

    return res.json({id:selectedCoupon._id, totalPrice, discountedPrice }).send();
  } catch (error) {
    console.error(error);
    console.log(selectedCoupon.id);
    res.status(500).send('error');
  }
};


exports.coupondelete = async (req, res) => {
  const couponId = req.params.id;

  try {
    await Coupon.findByIdAndDelete(couponId);
    res.redirect("/admin/coupon");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};
