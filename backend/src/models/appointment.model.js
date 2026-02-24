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
 * Controller sẽ gọi schedules model để mở slot 
 */
// status là optional – nếu truyền vào thì filter thêm theo status
exports.findByDoctorId = async (doctorId, status = null, limit = 10, offset = 0) => {
  let sql = 'SELECT * FROM appointments WHERE doctor_id = ?';
  const params = [doctorId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY date DESC, start_time DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
};

exports.countByDoctorId = async (doctorId, status = null) => {
  let sql = 'SELECT COUNT(*) AS total FROM appointments WHERE doctor_id = ?';
  const params = [doctorId];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  const [[{ total }]] = await pool.query(sql, params);
  return total;
};

// status là optional – nếu truyền vào thì filter thêm theo status
exports.findByPatientId = async (patientId, status = null, limit = 10, offset = 0) => {
  let sql = 'SELECT * FROM appointments WHERE patient_id = ?';
  const params = [patientId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY date DESC, start_time DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);
  return rows;
};

exports.countByPatientId = async (patientId, status = null) => {
  let sql = 'SELECT COUNT(*) AS total FROM appointments WHERE patient_id = ?';
  const params = [patientId];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  const [[{ total }]] = await pool.query(sql, params);
  return total;
};
