const pool = require('../config/db');
const { v4: uuid } = require('uuid');
const Patient = require('../models/patient.model');

//======================================
// Helper validate đơn giản để tránh dữ liệu bậy
//======================================
const isValidDate = (value) => {
  if (!value) return true; // cho phép null/undefined
  // format YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const allowedGenders = ['MALE', 'FEMALE', 'OTHER'];

//======================================
// GET /api/v1/patients/me
// Lấy profile của chính patient đang đăng nhập
// Middleware auth(['PATIENT']) sẽ gắn req.user
// req.user.userId lấy từ JWT payload lúc login
//======================================
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    // join users + patients để trả về đủ dữ liệu
    const profile = await Patient.getProfileByUserId(userId);

    if (!profile) {
      // trường hợp user có role PATIENT nhưng chưa có record patients
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    res.json(profile);
  } catch (err) {
    console.error('GET PATIENT ME ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

//======================================
// PUT /api/v1/patients/me
// Update hồ sơ patient: update 2 bảng
// - users: name, phone
// - patients: dateOfBirth, gender, medicalHistory
// Dùng transaction để tránh update nửa chừng
//
// NOTE: mình đổi sang kiểu PATCH:
// - field nào không gửi -> giữ nguyên (không set null hết)
//======================================
exports.updateMe = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.user.userId;
    const { name, phone, dateOfBirth, gender, medicalHistory } = req.body;

    // validate cơ bản
    if (!isValidDate(dateOfBirth)) {
      return res.status(400).json({ error: 'dateOfBirth must be YYYY-MM-DD' });
    }
    if (gender && !allowedGenders.includes(gender)) {
      return res.status(400).json({ error: 'gender must be MALE/FEMALE/OTHER' });
    }

    await conn.beginTransaction();

    // 0) lấy profile hiện tại để PATCH (giữ lại giá trị cũ)
    // dùng conn.query để cùng transaction
    const [currentRows] = await conn.query(
      `SELECT 
         u.name, u.phone,
         p.id AS patientId,
         p.date_of_birth AS dateOfBirth,
         p.gender,
         p.medical_history AS medicalHistory
       FROM users u
       LEFT JOIN patients p ON p.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    const current = currentRows[0];
    if (!current) {
      await conn.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    // 1) update users (name, phone) - patch
    const nextName = (name !== undefined) ? name : current.name;
    const nextPhone = (phone !== undefined) ? phone : current.phone;

    await conn.query(
      `UPDATE users SET name = ?, phone = ? WHERE id = ?`,
      [nextName ?? null, nextPhone ?? null, userId]
    );

    // 2) nếu chưa có record patients -> tạo mới (auto-create cho tiện)
    // nếu bạn muốn strict: thì return 404 thay vì tạo
    if (!current.patientId) {
      await conn.query(
        `INSERT INTO patients (id, user_id, date_of_birth, gender, medical_history)
         VALUES (?, ?, ?, ?, ?)`,
        [
          uuid(),
          userId,
          dateOfBirth ?? null,
          gender ?? null,
          medicalHistory ?? null
        ]
      );
    } else {
      // 3) update patients - patch
      const nextDob = (dateOfBirth !== undefined) ? dateOfBirth : current.dateOfBirth;
      const nextGender = (gender !== undefined) ? gender : current.gender;
      const nextHistory = (medicalHistory !== undefined) ? medicalHistory : current.medicalHistory;

      await conn.query(
        `UPDATE patients
         SET date_of_birth = ?, gender = ?, medical_history = ?
         WHERE user_id = ?`,
        [nextDob ?? null, nextGender ?? null, nextHistory ?? null, userId]
      );
    }

    await conn.commit();

    // trả về profile mới cho tiện test
    const profile = await Patient.getProfileByUserId(userId);
    res.json({ message: 'Updated', profile });
  } catch (err) {
    await conn.rollback();
    console.error('UPDATE PATIENT ME ERROR:', err);
    res.status(400).json({ error: err });
  } finally {
    conn.release();
  }
};

//======================================
// (OPTIONAL) GET /api/v1/patients/:id
// Admin xem profile theo patientId
//======================================
exports.getById = async (req, res) => {
  try {
    const patientId = req.params.id;
    const profile = await Patient.getProfileByPatientId(patientId);
    if (!profile) return res.status(404).json({ error: 'Patient not found' });
    res.json(profile);
  } catch (err) {
    console.error('GET PATIENT BY ID ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
