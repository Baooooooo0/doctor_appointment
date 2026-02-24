const pool = require('../config/db');

//Tìm tất cả notification của 1 user (có phân trang)
exports.findByUserId = async (userId, limit = 20, offset = 0) => {
  const [rows] = await pool.query(
    `SELECT id, user_id, title, content, type, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, Number(limit), Number(offset)]
  );
  return rows;
};

//Đếm số notification chưa đọc của 1 user
exports.countUnread = async (userId) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS unread
     FROM notifications
     WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return rows[0]?.unread || 0;
};

//Tạo notification mới
exports.create = async (notification) => {
  await pool.query(
    `INSERT INTO notifications (id, user_id, title, content, type, is_read)
     VALUES (?, ?, ?, ?, ?, ?)`,
    Object.values(notification)
  );
};

//Đánh dấu 1 notification là đã đọc (chỉ update nếu thuộc về đúng user)
exports.markRead = async (id, userId) => {
  const [result] = await pool.query(
    `UPDATE notifications
     SET is_read = 1
     WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return result.affectedRows; //0: không có gì update (id sai hoặc không phải của user)
};

//Đánh dấu tất cả notification của user là đã đọc
exports.markAllRead = async (userId) => {
  const [result] = await pool.query(
    `UPDATE notifications
     SET is_read = 1
     WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return result.affectedRows;
};
