exports.createWithConn = async (conn, doctor) => {
  await conn.query(
    `INSERT INTO doctors (id, user_id, specialty, experience_years, description)
     VALUES (?, ?, ?, ?, ?)`,
    [
      doctor.id,
      doctor.userId,
      doctor.specialty ?? null,
      doctor.experienceYears ?? 0,
      doctor.description ?? null
    ]
  );
};
