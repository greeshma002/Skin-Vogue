const collection = require("../models/UserSchema");
const { sendOTP, generateOTP } = require("../utils/mailing");
exports.verifyOTP = async (req, res) => {
  try {
  const userInputOTP = req.body.otp;
  const originalOTP = req.session.otp;
  const now = new Date().getTime();
  if (userInputOTP === originalOTP && req.session.otpExpiry > now) {
    const user = await collection.findOne({ email: req.session.email });
    user.isVerified = true;
    await user.save();
    res.redirect("/login");
    req.session.otp = null;
    req.session.otpExpiry = 0;
  } else {
    const errorMessage = "invalid OTP";
    res.render("user/otp", { message: errorMessage, email: req.body.email });
  }
 } catch (error) {
    res.status(500).send("Internal Server Error");
 }
};

exports.resend = async (req, res) => {
  try{
  let email = req.body.email;
  sendMailfn(req, res, email);
  res.render("user/otp", { email: email });
} catch (error) {
  res.status(500).send("Internal Server Error");
}
}

function sendMailfn(req, res, email) {
  req.session.otp = generateOTP();
  const now = new Date();
  req.session.otpExpiry = now.getTime() + 3 * 60 * 1000;
  sendOTP(email, req.session.otp);
  console.log(`${email} got the OTP for ${req.session.otp}`);
}
 