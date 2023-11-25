const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

router.post("/registerOTP",otpController.verifyOTP)
router.post('/resendOTP',otpController.resend)
module.exports = router;
