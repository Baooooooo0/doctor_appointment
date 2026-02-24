const pool = require('../config/db');
const { v4: uuid } = require('uuid');

/**
 * Model cho bảng refresh_tokens
 * Lưu refreshToken vào DB để có thể thu hồi khi logout
 */

/**
 * Lưu refresh token mới vào DB
 * @param {string} userId
 * @param {string} token  – JWT string
 * @param {Date}   expiresAt – thời điểm hết hạn
 */
exports.save = async (userId, token, expiresAt) => {
    const id = uuid();
    await pool.query(
        `INSERT INTO refresh_tokens (id, user_id, token, expires_at)
     VALUES (?, ?, ?, ?)`,
        [id, userId, token, expiresAt]
    );
    return id;
};

/**
 * Tìm refresh token trong DB (chỉ lấy token chưa hết hạn)
 * @returns {object|null}
 */
exports.findByToken = async (token) => {
    const [rows] = await pool.query(
        `SELECT * FROM refresh_tokens
     WHERE token = ? AND expires_at > NOW()`,
        [token]
    );
    return rows[0] || null;
};

/**
 * Xóa 1 refresh token (logout thiết bị hiện tại)
 */
exports.deleteByToken = async (token) => {
    await pool.query(
        'DELETE FROM refresh_tokens WHERE token = ?',
        [token]
    );
};

/**
 * Xóa tất cả refresh token của 1 user (logout toàn bộ thiết bị)
 */
exports.deleteByUserId = async (userId) => {
    await pool.query(
        'DELETE FROM refresh_tokens WHERE user_id = ?',
        [userId]
    );
};
