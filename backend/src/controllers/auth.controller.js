const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const pool = require('../config/db');
const User = require('../models/user.model');
const Patient = require('../models/patient.model');
const Doctor = require('../models/doctor.model');
const RefreshToken = require('../models/refreshToken.model');

// ─── Config ───────────────────────────────────────────────────
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày tính bằng ms

/**
 * Helper: tạo cả 2 token và lưu refreshToken vào DB
 * @returns {{ accessToken, refreshToken }}
 */
async function generateTokens(payload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });

  // Lưu refreshToken vào DB để có thể thu hồi khi logout
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MS);
  await RefreshToken.save(payload.id, refreshToken, expiresAt);

  return { accessToken, refreshToken };
}


//================ REGISTER =================
exports.register = async (req, res) => {
  try {
    //lấy dữ liệu từ body req
    const {
      name,
      email,
      password,
      phone,        // optional – áp dụng cho mọi role
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

      //tạo user trong bảng users (thêm phone)
      await conn.query(
        `INSERT INTO users (id, name, email, password, role, phone)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, name, email, hashedPassword, role, phone ?? null]
      );

      // Tạo profile theo role, lưu profileId để đưa vào JWT
      let patientId = null;
      let doctorId = null;

      if (role === 'PATIENT') {
        patientId = uuid(); // lưu lại để dùng trong payload
        await conn.query(
          `INSERT INTO patients (id, user_id, date_of_birth, gender, medical_history)
           VALUES (?, ?, ?, ?, ?)`,
          [patientId, userId, dateOfBirth ?? null, gender ?? null, medicalHistory ?? null]
        );
      }

      if (role === 'DOCTOR') {
        doctorId = uuid(); // lưu lại để dùng trong payload
        await conn.query(
          `INSERT INTO doctors (id, user_id, specialty, experience_years, description)
           VALUES (?, ?, ?, ?, ?)`,
          [doctorId, userId, specialty ?? null, experienceYears ?? 0, description ?? null]
        );
      }

      //chỉ commit khi user hoặc profile tạo thành công
      await conn.commit();

      // Tạo cả 2 token giống login
      const payload = { id: userId, role, patientId, doctorId };
      const { accessToken, refreshToken } = await generateTokens(payload);

      return res.status(201).json({
        accessToken,
        refreshToken,
        user: { id: userId, name, email, role }

      });

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

    // [New] Check if account is locked
    if (user.is_locked) {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
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

    // 5. Tạo payload + cả 2 token
    const payload = { id: user.id, role: user.role, patientId, doctorId };
    const { accessToken, refreshToken } = await generateTokens(payload);

    res.json({
      accessToken,   // dùng để gọi API (15 phút)
      refreshToken,  // dùng để lấy accessToken mới (7 ngày)
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

//================ REFRESH TOKEN =================
/**
 * POST /api/v1/auth/refresh
 * Body: { refreshToken }
 * → Verify refreshToken (JWT + DB) → trả accessToken mới
 */
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken là bắt buộc' });
    }

    // 1. Verify chữ ký + hạn sử dụng JWT
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'refreshToken không hợp lệ hoặc đã hết hạn' });
    }

    // 2. Kiểm tra token có trong DB không (chưa bị logout)
    const stored = await RefreshToken.findByToken(refreshToken);
    if (!stored) {
      return res.status(401).json({ error: 'refreshToken đã bị thu hồi' });
    }

    // 3. Tạo accessToken mới (chỉ tạo access, giữ nguyên refreshToken cũ)
    const payload = {
      id: decoded.id,
      role: decoded.role,
      patientId: decoded.patientId,
      doctorId: decoded.doctorId
    };
    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('REFRESH ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

//================ LOGOUT =================
/**
 * POST /api/v1/auth/logout
 * Header: Authorization Bearer <accessToken>
 * Body (optional): { all: true } để logout khỏi mọi thiết bị
 */
exports.logout = async (req, res) => {
  try {
    const { refreshToken, all } = req.body;

    if (all) {
      // Logout tất cả thiết bị
      await RefreshToken.deleteByUserId(req.user.id);
      return res.json({ message: 'Logged out from all devices' });
    }

    if (!refreshToken) {
      return res.status(400).json({ error: 'Cần gửi refreshToken hoặc all: true' });
    }

    // Logout thiết bị hiện tại
    await RefreshToken.deleteByToken(refreshToken);
    res.json({ message: 'Logout successful' });
  } catch (err) {
    console.error('LOGOUT ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
