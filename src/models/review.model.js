const pool = require('../config/db');

//Tạo review mới
exports.create = async (review) => {
  await pool.query(
    `INSERT INTO reviews (id, appointment_id, patient_id, doctor_id, rating, comment)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      review.id,
      review.appointment_id,
      review.patient_id,
      review.doctor_id,
      review.rating,
      review.comment
    ]
  );
};

//Tìm review theo appointment (để check đã review chưa)
exports.findByAppointmentId = async (appointmentId) => {
  const [rows] = await pool.query(
    'SELECT * FROM reviews WHERE appointment_id = ? LIMIT 1',
    [appointmentId]
  );
  return rows[0];
};

//Lấy danh sách review của 1 doctor (phục vụ màn doctor detail)
exports.findByDoctorId = async (doctorId) => {
  const [rows] = await pool.query(
    `SELECT id, appointment_id, patient_id, doctor_id, rating, comment, created_at
     FROM reviews
     WHERE doctor_id = ?
     ORDER BY created_at DESC`,
    [doctorId]
  );
  return rows;
};

//Tính rating trung bình + tổng review của doctor (để show nhanh)
exports.getDoctorStats = async (doctorId) => {
  const [rows] = await pool.query(
    `SELECT 
        COUNT(*) AS totalReviews,
        AVG(rating) AS avgRating
     FROM reviews
     WHERE doctor_id = ?`,
    [doctorId]
  );
  return rows[0];
};
