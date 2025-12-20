const pool = require('../config/db');

//======================================
// INSERT patient (dùng trong transaction register)
//======================================
exports.createWithConn = async (conn, patient) => {
  await conn.query(
    `INSERT INTO patients (id, user_id, date_of_birth, gender, medical_history)
     VALUES (?, ?, ?, ?, ?)`,
    [
      patient.id,
      patient.userId,
      patient.dateOfBirth ?? null,
      patient.gender ?? null,
      patient.medicalHistory ?? null
    ]
  );
};

//======================================
// FIND patient by user_id
// Mục đích: khi user login bằng JWT, decoded.userId -> tìm patient record tương ứng
//======================================
exports.findByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT * FROM patients WHERE user_id = ?`,
    [userId]
  );
  return rows[0];
};

//======================================
// GET full profile của patient (join users + patients)
// Mục đích: trả về info đầy đủ cho /patients/me
//======================================
exports.getProfileByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT 
        u.id AS userId,
        u.name,
        u.email,
        u.phone,
        u.role,
        p.id AS patientId,
        p.date_of_birth AS dateOfBirth,
        p.gender,
        p.medical_history AS medicalHistory
     FROM users u
     JOIN patients p ON p.user_id = u.id
     WHERE u.id = ?`,
    [userId]
  );

  return rows[0];
};

//======================================
// UPDATE patient profile (patients table)
//======================================
exports.updateProfileByUserId = async (userId, data) => {
  await pool.query(
    `UPDATE patients
     SET date_of_birth = ?, gender = ?, medical_history = ?
     WHERE user_id = ?`,
    [
      data.dateOfBirth ?? null,
      data.gender ?? null,
      data.medicalHistory ?? null,
      userId
    ]
  );
};

//======================================
// (NEW) GET full profile by patientId (admin dùng)
//======================================
exports.getProfileByPatientId = async (patientId) => {
  const [rows] = await pool.query(
    `SELECT 
        u.id AS userId,
        u.name,
        u.email,
        u.phone,
        u.role,
        p.id AS patientId,
        p.date_of_birth AS dateOfBirth,
        p.gender,
        p.medical_history AS medicalHistory
     FROM users u
     JOIN patients p ON p.user_id = u.id
     WHERE p.id = ?`,
    [patientId]
  );
  return rows[0];
};

//======================================
// (NEW) CREATE patient (không cần transaction) - dùng nếu bạn muốn auto-create
//======================================
exports.create = async (patient) => {
  await pool.query(
    `INSERT INTO patients (id, user_id, date_of_birth, gender, medical_history)
     VALUES (?, ?, ?, ?, ?)`,
    [
      patient.id,
      patient.userId,
      patient.dateOfBirth ?? null,
      patient.gender ?? null,
      patient.medicalHistory ?? null
    ]
  );
};
