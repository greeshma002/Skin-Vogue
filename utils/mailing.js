
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});

function generateOTP() {
  const otpLength = 6;
  let otp = "";
  const digits = "0123456789";
  for (let i = 0; i < otpLength; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

function sendOTP(email, otp) {
  let mailOptions = {
    from: process.env.GMAIL_USERNAME,
    to: email,
    subject: "Your OTP",
    text: `Your OTP is ${otp}. Don't share this OTP with others.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error(error);
    }
    console.log("✉️ An OTP Email has been sent. (%s)", info.messageId);
    console.log("OTP was " + otp);
  });
}

module.exports = {
  sendOTP,
  generateOTP,
};
