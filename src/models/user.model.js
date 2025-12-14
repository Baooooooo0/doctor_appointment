const pool = require('../config/db');

exports.findByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
};

exports.create = async (user) => {
  await pool.query(
    `INSERT INTO users (id, name, email, password, role)
     VALUES (?, ?, ?, ?, ?)`,
    Object.values(user)
  );
};
