const collection = require("../models/UserSchema");
const { sendOTP, generateOTP } = require("../utils/mailing");
exports.verifyOTP = async (req, res) => {
  const userInputOTP = req.body.otp;
  const originalOTP = req.session.otp;
  const now = new Date().getTime();

  if (userInputOTP === originalOTP && req.session.otpExpiry > now) {
    const user = await collection.findOne({ email: req.session.email });
    user.isVerified = true;
    await user.save();

    // res.status(200).send({ message: "OTP verified successfully" });
    res.redirect("/login");
    req.session.otp = null;
    req.session.otpExpiry = 0;
  } else {
    const errorMessage = "invalid OTP";
    res.render("user/otp", { message: errorMessage, email: req.body.email });
  }
};

exports.resend = async (req, res) => {
  let email = req.body.email;
  sendMailfn(req, res, email);
  res.render("user/otp", { email: email });
};

function sendMailfn(req, res, email) {
  req.session.otp = generateOTP();
  const now = new Date();
  req.session.otpExpiry = now.getTime() + 3 * 60 * 1000;
  //sendOTP(email, req.session.otp);
  console.log(`${email} got the OTP for ${req.session.otp}`);
}
