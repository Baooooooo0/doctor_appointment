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
