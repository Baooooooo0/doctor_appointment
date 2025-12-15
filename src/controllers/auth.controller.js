//Import thư viện jsonwebtoken
//Tạo JWT token khi login
// Token này dùng để xác thực các request sau (Authorization)
const jwt = require('jsonwebtoken');

//Import bcryptjs
//Hash password khi đăng ký
// So sánh password khi đăng nhập
const bcrypt = require('bcryptjs');

//Import hàm tạo UUID version 4
//Mỗi user sẽ có ID duy nhất, không trùng
const { v4: uuid } = require('uuid');

//Import pool để dùng transaction
const pool = require('../config/db');

//Import model
// Model này chịu trách nhiệm: Query database, findByEmail, create,...
const User = require('../models/user.model');
const Patient = require('../models/patient.model');
const Doctor = require('../models/doctor.model');


//================ REGISTER =================
exports.register = async (req, res) => {
  try {
    //lấy dữ liệu từ body req
    const {
      name,
      email,
      password,
      role,
      dateOfBirth,
      gender,
      medicalHistory,
      specialty,
      experienceYears,
      description
    } = req.body;

    // 1. validate dữ liệu
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Missing fields' }); // trả về 400 bad request
    }

    // role chỉ cho phép các giá trị bạn dùng trong middleware
    const allowedRoles = ['PATIENT', 'DOCTOR', 'ADMIN'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // 2. check email exists
    //Gọi model tìm user theo email
    const existing = await User.findByEmail(email);

    //nếu user tồn tại
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' }); //trả về 409 conflict
    }

    // 3. hash password
    //hash password trước khi lưu vào db
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. transaction: tạo user + patient/doctor

    // Gộp nhiều câu INSERT thành 1 giao dịch
    // Nếu 1 bước lỗi → rollback toàn bộ
    // Tránh tình trạng:
    // Có user nhưng không có patient/doctor
    // Dữ liệu “mồ côi”
    const conn = await pool.getConnection();
    try {
      //bắt đầu stransaction
      await conn.beginTransaction();

      const userId = uuid(); //sinh id cho user

      //tạo user trong bảng users
      await conn.query(
        `INSERT INTO users (id, name, email, password, role)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, name, email, hashedPassword, role]
      );

      //tạo profile theo role
      if (role === 'PATIENT') {
        await conn.query(
            //gắn userid để liên kết
          `INSERT INTO patients (id, user_id, date_of_birth, gender, medical_history)
           VALUES (?, ?, ?, ?, ?)`,
          [uuid(), userId, dateOfBirth ?? null, gender ?? null, medicalHistory ?? null]
        );
      }

      if (role === 'DOCTOR') {
        await conn.query(
            //gắn userid để liên kết
          `INSERT INTO doctors (id, user_id, specialty, experience_years, description)
           VALUES (?, ?, ?, ?, ?)`,
          [uuid(), userId, specialty ?? null, experienceYears ?? 0, description ?? null]
        );
      }

      //chỉ commit khi user hoặc profile tạo thành công
      await conn.commit();

      res.status(201).json({ message: 'Register success' }); // trả về 201 created
    } catch (err) {
      await conn.rollback(); // nếu register thất bại thì rollback (tạo user hoặc patient/doctor fail)
      console.error('REGISTER TRANSACTION ERROR:', err);
      res.status(500).json({ error: 'Register failed' }); // trả về 500
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


//================ LOGIN =================
exports.login = async (req, res) => {
  try {
    //lấy dữ liệu từ req.body
    const { email, password } = req.body;

    // 1. check input
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' }); // trả về 400
    }

    // 2. find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' }); // trả về 401 – Unauthorized
    }

    // 3. compare password
    const isMatch = await bcrypt.compare(password, user.password); //so sánh password user nhập với password đã hash trong db
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4. lấy patientId / doctorId theo role để API /appointments, schedules biết nên lấy patientid hay doctorid
    let patientId = null;
    let doctorId = null;

    if (user.role === 'PATIENT') {
        //query tìm patientid theo userid
      const [rows] = await pool.query(
        'SELECT id FROM patients WHERE user_id = ?',
        [user.id]
      );
      patientId = rows[0]?.id || null; //lấy kết quả đầu tiên 
    }

    //query tìm doctorid theo userid
    if (user.role === 'DOCTOR') {
      const [rows] = await pool.query(
        'SELECT id FROM doctors WHERE user_id = ?',
        [user.id]
      );
      doctorId = rows[0]?.id || null;
    }

    // 5. create token payload
    const payload = {
      userId: user.id,
      role: user.role,
      patientId,
      doctorId
    };

    // 6. sign JWT
    const token = jwt.sign(
      payload, // dữ liệu bên trong token
      process.env.JWT_SECRET, //secret key chỉ server biết để verify token
      { expiresIn: '1d' } // hết hạn sau 1 ngày
    );

    //trả về res
    res.json({
      token, // token để client lưu
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
