const pool = require('../config/db');

// Lấy slot còn trống theo doctor + date (dùng cho patient xem)
exports.findAvailableByDoctorAndDate = async (doctorId, date) => {
  const [rows] = await pool.query(
    `
    SELECT id, doctor_id AS doctorId, date, start_time AS startTime, end_time AS endTime, is_available AS isAvailable
    FROM schedules
    WHERE doctor_id = ? AND date = ? AND is_available = TRUE
    ORDER BY start_time ASC
    `,
    [doctorId, date]
  );
  return rows;
};

// Lấy tất cả slot của 1 doctor theo date (doctor xem, có thể gồm cả unavailable)
exports.findByDoctorAndDate = async (doctorId, date) => {
  const [rows] = await pool.query(
    `
    SELECT id, doctor_id AS doctorId, date, start_time AS startTime, end_time AS endTime, is_available AS isAvailable
    FROM schedules
    WHERE doctor_id = ? AND date = ?
    ORDER BY start_time ASC
    `,
    [doctorId, date]
  );
  return rows;
};

// Tạo slot mới
exports.create = async ({ id, doctorId, date, startTime, endTime }) => {
  await pool.query(
    `
    INSERT INTO schedules (id, doctor_id, date, start_time, end_time, is_available)
    VALUES (?, ?, ?, ?, ?, TRUE)
    `,
    [id, doctorId, date, startTime, endTime]
  );
};

// Kiểm tra slot trùng (để không tạo 2 slot y hệt)
exports.existsOverlap = async ({ doctorId, date, startTime, endTime }) => {
  // Logic overlap: slot mới giao nhau với slot cũ nếu:
  // startTime < oldEndTime AND endTime > oldStartTime
  const [rows] = await pool.query(
    `
    SELECT id
    FROM schedules
    WHERE doctor_id = ? AND date = ?
      AND ( ? < end_time AND ? > start_time )
    LIMIT 1
    `,
    [doctorId, date, startTime, endTime]
  );
  return rows.length > 0;
};

// Huỷ slot (chỉ cho huỷ khi còn available)
exports.cancelIfAvailable = async (scheduleId, doctorId) => {
  const [result] = await pool.query(
    `
    UPDATE schedules
    SET is_available = FALSE
    WHERE id = ? AND doctor_id = ? AND is_available = TRUE
    `,
    [scheduleId, doctorId]
  );
  return result.affectedRows; // 1 = huỷ được, 0 = không huỷ được
};
