const collection = require("../models/mongodb");

exports.verifyOTP = async (req, res) => {
  const userInputOTP = req.body.otp;
  const originalOTP = req.session.otp;
  const now = new Date().getTime();

  if (userInputOTP === originalOTP && req.session.otpExpiry > now) {
    const user = await collection.findOne({ email: req.session.email });
    user.isVerified = true;
    await user.save();

    //res.status(200).send({ message: "OTP verified successfully" });
    res.redirect("/login")
    req.session.otp = null;
    req.session.otpExpiry = 0;
  } else {
    // const errorMessage = "invalid OTP"
    res.render("user/otp", {message : 'your otp is invalid'})
  
  }
};
