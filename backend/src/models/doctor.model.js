const pool = require('../config/db');

// Lấy danh sách bác sĩ (có thể join user để lấy name/email/phone)
exports.findAll = async (limit = 10, offset = 0) => {
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
    ORDER BY d.rating DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);
  return rows;
};

exports.countAll = async () => {
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM doctors d JOIN users u ON u.id = d.user_id WHERE u.role = 'DOCTOR'`
  );
  return total;
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

// Lấy profile doctor đang login
// userId lấy từ JWT (req.user.id)
exports.findMe = async (userId) => {
  const [rows] = await pool.query(
    `
    SELECT 
      d.id AS doctorId,
      d.specialty,
      d.experience_years AS experienceYears,
      d.description,
      d.rating,
      d.user_id AS userId,
      u.name,
      u.email,
      u.phone,
      d.created_at AS createdAt
    FROM doctors d
    JOIN users u ON u.id = d.user_id
    WHERE d.user_id = ?
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
};

// Tìm kiếm bác sĩ theo name và/hoặc specialty (cả hai đều optional)
// Dùng dynamic WHERE để chỉ filter những field được truyền vào
exports.search = async ({ name, specialty } = {}) => {
  // Bắt đầu với điều kiện luôn đúng để dễ append AND
  const conditions = ['u.role = ?'];
  const params = ['DOCTOR'];

  // Nếu client gửi name → thêm điều kiện LIKE (tìm kiếm mờ)
  if (name) {
    conditions.push('u.name LIKE ?');
    params.push(`%${name}%`); // %keyword% → khớp ở bất kỳ vị trí nào
  }

  // Nếu client gửi specialty → thêm điều kiện LIKE
  if (specialty) {
    conditions.push('d.specialty LIKE ?');
    params.push(`%${specialty}%`);
  }

  // Nối các điều kiện lại bằng AND
  const whereClause = conditions.join(' AND ');

  const [rows] = await pool.query(
    `SELECT 
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
    WHERE ${whereClause}
    ORDER BY d.rating DESC`,
    params
  );

  return rows;
};

// Update profile doctor đang login (optional fields)
exports.updateMe = async (userId, { specialty, experienceYears, description }) => {
  // lấy current để giữ giá trị cũ nếu field không gửi
  const current = await exports.findMe(userId);
  if (!current) return null;

  const newSpecialty = specialty ?? current.specialty;
  const newExperienceYears =
    experienceYears ?? current.experienceYears ?? 0;
  const newDescription = description ?? current.description;

  await pool.query(
    `
    UPDATE doctors
    SET specialty = ?, experience_years = ?, description = ?
    WHERE user_id = ?
    `,
    [newSpecialty, newExperienceYears, newDescription, userId]
  );

  return await exports.findMe(userId);
};

