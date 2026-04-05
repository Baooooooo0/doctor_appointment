/**
 * Payment Model
 * Nhiệm vụ: chỉ query DB, không xử lý req/res
 */

const pool = require('../config/db');

/**
 * Insert payment record trong transaction
 * @param {object} conn - MySQL connection (đang trong transaction)
 * @param {object} data
 */
exports.insertWithConn = async (conn, data) => {
    const {
        id,
        appointmentId,
        amount,
        vnpTxnRef,
        expiresAt,
    } = data;

    await conn.query(
        `INSERT INTO payments
       (id, appointment_id, amount, vnp_txn_ref, expires_at, status, refund_status)
     VALUES (?, ?, ?, ?, ?, 'PENDING', 'NONE')`,
        [id, appointmentId, amount, vnpTxnRef, expiresAt]
    );
};

/** Tìm theo vnp_txn_ref */
exports.findByTxnRef = async (txnRef) => {
    const [rows] = await pool.query(
        'SELECT * FROM payments WHERE vnp_txn_ref = ?',
        [txnRef]
    );
    return rows[0];
};

/** Tìm theo appointment_id */
exports.findByAppointmentId = async (appointmentId) => {
    const [rows] = await pool.query(
        'SELECT * FROM payments WHERE appointment_id = ?',
        [appointmentId]
    );
    return rows[0];
};

/** Cập nhật PAID */
exports.updatePaid = async (id, transactionNo, bankCode) => {
    await pool.query(
        `UPDATE payments
     SET status = 'PAID',
         vnp_transaction_no = ?,
         vnp_bank_code = ?,
         paid_at = NOW()
     WHERE id = ?`,
        [transactionNo, bankCode, id]
    );
};

/** Cập nhật FAILED */
exports.updateFailed = async (id) => {
    await pool.query(
        "UPDATE payments SET status = 'FAILED' WHERE id = ?",
        [id]
    );
};

/** Cập nhật REFUNDED */
exports.updateRefunded = async (id) => {
    await pool.query(
        "UPDATE payments SET status = 'REFUNDED', refund_status = 'DONE', refunded_at = NOW() WHERE id = ?",
        [id]
    );
};

/** Lấy danh sách payments PENDING đã hết hạn */
exports.findExpired = async () => {
    const [rows] = await pool.query(
        "SELECT * FROM payments WHERE status = 'PENDING' AND expires_at < NOW()"
    );
    return rows;
};
