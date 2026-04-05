/**
 * Job: Expire payments chưa thanh toán sau 15 phút
 * Chạy mỗi 1 phút bằng node-cron
 */

const cron = require('node-cron');
const pool = require('../config/db');
const Payment = require('../models/payment.model');

async function expirePayments() {
    const expired = await Payment.findExpired();
    if (!expired.length) return;

    console.log(`[ExpireJob] Found ${expired.length} expired payment(s)`);

    for (const payment of expired) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 1) Đánh dấu payment FAILED
            await conn.query(
                "UPDATE payments SET status = 'FAILED' WHERE id = ?",
                [payment.id]
            );

            // 2) Cập nhật appointment EXPIRED
            await conn.query(
                "UPDATE appointments SET status = 'EXPIRED' WHERE id = ?",
                [payment.appointment_id]
            );

            // 3) Mở lại schedule slot
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

            await conn.commit();
            console.log(`[ExpireJob] Expired payment ${payment.id} (appointment ${payment.appointment_id})`);
        } catch (err) {
            await conn.rollback();
            console.error(`[ExpireJob] Error expiring payment ${payment.id}:`, err.message);
        } finally {
            conn.release();
        }
    }
}

/** Khởi động cron — gọi trong app.js */
exports.start = () => {
    // Chạy mỗi phút
    cron.schedule('* * * * *', expirePayments);
    console.log('[ExpireJob] Started — running every minute');
};
