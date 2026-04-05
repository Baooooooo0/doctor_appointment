/**
 * Payment Controller
 *
 * GET  /api/v1/payments/vnpay-return  → vnpayReturn  (VNPay redirect user về sau TT)
 * POST /api/v1/payments/vnpay-ipn     → vnpayIpn     (VNPay gọi server-to-server)
 */

const pool = require('../config/db');
const Payment = require('../models/payment.model');
const Appointment = require('../models/appointment.model');
const VNPaySvc = require('../services/vnpay.service');

/**
 * GET /api/v1/payments/vnpay-return
 * VNPay redirect user về URL này sau khi thanh toán.
 * Chỉ redirect sang frontend, KHÔNG update DB ở đây (IPN mới chính xác).
 */
exports.vnpayReturn = (req, res) => {
    const { valid, responseCode, txnRef } = VNPaySvc.verifyReturn(req.query);

    // Redirect về frontend với kết quả
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!valid) {
        return res.redirect(`${frontendBase}/payment/result?status=error&code=${responseCode}`);
    }

    if (responseCode === '00') {
        return res.redirect(`${frontendBase}/payment/result?status=success&ref=${txnRef}`);
    }

    return res.redirect(`${frontendBase}/payment/result?status=failed&code=${responseCode}&ref=${txnRef}`);
};

/**
 * POST /api/v1/payments/vnpay-ipn
 * VNPay gọi server-to-server để thông báo kết quả thanh toán.
 * Đây là nguồn sự thật duy nhất để update DB.
 */
exports.vnpayIpn = async (req, res) => {
    // VNPay gửi IPN qua GET query string, không phải POST body
    const query = req.query;

    // 1) Verify signature
    const { valid, responseCode, txnRef, transactionNo, bankCode } = VNPaySvc.verifyIpn(query);

    if (!valid) {
        // Signature không hợp lệ → báo lỗi về VNPay
        return res.json({ RspCode: '97', Message: 'Invalid signature' });
    }

    // 2) Tìm payment theo txnRef
    const payment = await Payment.findByTxnRef(txnRef);
    if (!payment) {
        return res.json({ RspCode: '01', Message: 'Order not found' });
    }

    // 3) Idempotency: nếu đã xử lý rồi thì không làm lại
    if (payment.status !== 'PENDING') {
        return res.json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    // 4) Bắt đầu transaction DB
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        if (responseCode === '00') {
            // Thanh toán thành công
            await Payment.updatePaid(payment.id, transactionNo, bankCode);

            // Cập nhật appointment → PENDING (chờ doctor confirm)
            await conn.query(
                "UPDATE appointments SET status = 'PENDING' WHERE id = ?",
                [payment.appointment_id]
            );
        } else {
            // Thanh toán thất bại
            await Payment.updateFailed(payment.id);

            // Cập nhật appointment → EXPIRED, mở lại slot
            await conn.query(
                "UPDATE appointments SET status = 'EXPIRED' WHERE id = ?",
                [payment.appointment_id]
            );

            const [appts] = await conn.query(
                'SELECT schedule_id FROM appointments WHERE id = ?',
                [payment.appointment_id]
            );
            if (appts.length) {
                await conn.query(
                    'UPDATE schedules SET is_available = TRUE WHERE id = ?',
                    [appts[0].schedule_id]
                );
            }
        }

        await conn.commit();
        return res.json({ RspCode: '00', Message: 'Confirm Success' });
    } catch (err) {
        await conn.rollback();
        console.error('VNPay IPN error:', err);
        return res.json({ RspCode: '99', Message: 'Unknown error' });
    } finally {
        conn.release();
    }
};
