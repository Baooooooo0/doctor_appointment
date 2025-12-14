const pool = require('../config/db');

//nhan vao email va tra ve user hoac undefined
exports.findByEmail = async (email) => {
  const [rows] = await pool.query( // rows la mang ket qua thong tin user duoc tra ve
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0]; // lay user dau tien, Email là unique->Nên chỉ có 0 hoặc 1 record->Nếu không tìm thấy → undefined
};

//nhan vao object user va insert user vao db
exports.create = async (user) => {
  await pool.query(
    `INSERT INTO users (id, name, email, password, role)
     VALUES (?, ?, ?, ?, ?)`,
    Object.values(user)
  );
};
