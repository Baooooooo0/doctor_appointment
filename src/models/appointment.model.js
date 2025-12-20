const pool = require('../config/db');

/**
 * Model: Appointment
 * Nhiệm vụ: chỉ query DB, KHÔNG xử lý req/res
 */
exports.findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM appointments WHERE id = ?',
    [id]
  );
  return rows[0];
};

/**
 * Tạo appointment trong transaction (dùng conn truyền từ controller)
 * - Controller sẽ lock schedule và update schedule availability
 * - Model chỉ insert dữ liệu
 */
exports.insertWithConn = async (conn, data) => {
  const {
    id,
    patientId,
    doctorId,
    scheduleId,
    date,
    startTime,
    endTime,
  } = data;

  await conn.query(
    `INSERT INTO appointments
      (id, patient_id, doctor_id, schedule_id, date, start_time, end_time, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
    [id, patientId, doctorId, scheduleId, date, startTime, endTime]
  );
};

/**
 * Update status appointment (doctor confirm/reject/complete)
 */
exports.updateStatus = async (id, status) => {
  await pool.query(
    'UPDATE appointments SET status = ? WHERE id = ?',
    [status, id]
  );
};

/**
 * Khi doctor reject: thường muốn mở lại slot schedule (is_available = true)
 * Controller sẽ gọi schedules model để mở slot (nếu bạn muốn)
 */
exports.findByDoctorId = async (doctorId) => {
  const [rows] = await pool.query(
    'SELECT * FROM appointments WHERE doctor_id = ? ORDER BY date DESC, start_time DESC',
    [doctorId]
  );
  return rows;
};

exports.findByPatientId = async (patientId) => {
  const [rows] = await pool.query(
    'SELECT * FROM appointments WHERE patient_id = ? ORDER BY date DESC, start_time DESC',
    [patientId]
  );
  return rows;
};
