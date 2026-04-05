const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payment.controller');

// VNPay redirect user về sau khi thanh toán (GET vì VNPay dùng GET redirect)
router.get('/vnpay-return', ctrl.vnpayReturn);

// VNPay gọi server-to-server (VNPay dùng GET cho IPN, không phải POST)
router.get('/vnpay-ipn', ctrl.vnpayIpn);

module.exports = router;
