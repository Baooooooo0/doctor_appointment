const pool = require('../config/db');

// Lấy danh sách bác sĩ (có thể join user để lấy name/email/phone)
exports.findAll = async () => {
//   FROM doctors d
// → lấy từ bảng doctors, đặt alias là d.

// JOIN users u ON u.id = d.user_id
// → nối với bảng users để lấy thông tin tài khoản.
// Điều kiện nối: user của doctor chính là d.user_id.

// WHERE u.role = 'DOCTOR'
// → lọc đúng những user có role DOCTOR.

// AS doctorId, AS experienceYears, AS userId
// → đổi tên cột trả về cho dễ dùng ở frontend (camelCase).
  const [rows] = await pool.query(`
    SELECT 
      d.id AS doctorId,
      d.specialty,
      d.experience_years AS experienceYears,
      d.description,
      d.rating,
      u.id AS userId,
      u.name,
      u.email,
      u.phone
    FROM doctors d 
    JOIN users u ON u.id = d.user_id
    WHERE u.role = 'DOCTOR'
  `);
// rows là mảng các bác sĩ.
// Trả về cho controller/service dùng tiếp.
  return rows;
};

// Lấy danh sách bác sĩ có slot trống theo ngày
exports.findAvailableByDate = async (date) => {
//   JOIN schedules s ON s.doctor_id = d.id
// → nối thêm bảng schedules để biết lịch của bác sĩ.

// WHERE s.date = ?
// → lọc theo ngày truyền vào hàm.
// ? là placeholder để chống SQL injection.

// AND s.is_available = TRUE
// → chỉ lấy các slot đang trống.

// COUNT(s.id) AS availableSlots
// → đếm số slot trống của từng doctor trong ngày đó.

// GROUP BY d.id, u.id
// → vì có COUNT, bắt buộc gom nhóm theo bác sĩ (và user tương ứng).

// ORDER BY availableSlots DESC, d.rating DESC
// → ưu tiên bác sĩ có nhiều slot trống trước, nếu bằng nhau thì ưu tiên rating cao.
  const [rows] = await pool.query(`
    SELECT 
      d.id AS doctorId,
      d.specialty,
      d.experience_years AS experienceYears,
      d.description,
      d.rating,
      u.name,
      u.email,
      u.phone,
      COUNT(s.id) AS availableSlots
    FROM doctors d
    JOIN users u ON u.id = d.user_id
    JOIN schedules s ON s.doctor_id = d.id
    WHERE s.date = ? AND s.is_available = TRUE
    GROUP BY d.id, u.id
    ORDER BY availableSlots DESC, d.rating DESC
    `,
    [date]
  );
  return rows;
};
