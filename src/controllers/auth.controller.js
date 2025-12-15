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

//Import User model
// Model này chịu trách nhiệm: Query database, findByEmail, create,...
const User = require('../models/user.model');

//REGISTER 
//express tự truyền req từ client và trả về res
exports.register = async (req, res) => {
  try {
    //lấy dữ liệu từ body req
    const { name, email, password, role } = req.body;

    // 1. validate dữ liệu
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Missing fields' }); // trả về 400 bad request
    }

    // 2. check email exists
    //Gọi model tìm user theo email
    const existingUser = await User.findByEmail(email);

    //nếu user tồn tại
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' }); //trả về 409 conflict
    }

    // 3. hash password
    //hash password trước khi lưu vào db
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. create user
    //tạo object user để lưu vào db
    const user = {
      id: uuid(),//sinh id ngẫu nhiên cho user 
      name,
      email,
      password: hashedPassword,//password đã hash
      role // 'PATIENT' | 'DOCTOR' | 'ADMIN', lưu role để sau này phân quyền
    };

    await User.create(user);// gọi model để inser user vào db 

    res.status(201).json({ message: 'Register success' }); // trả về 201 created
  } catch (err) {
    console.error('REGISTER ERROR:', err); 
    res.status(500).json({ error: 'Server error' });
  }
};

//LOGIN
exports.login = async (req, res) => {
  try {
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

    //nếu không khớp
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4. create token payload
    //tạo Payload = dữ liệu nhúng vào JWT
    // Lưu ID và role
    // Sau này middleware dùng để: Kiểm tra quyền và Xác định user hiện tại
    const payload = {
      userId: user.id,
      role: user.role,
      // thêm sau nếu có:
      // patientId: ...
      // doctorId: ...
    };

    // 5. sign JWT
    //tạo jwt
    const token = jwt.sign(
      payload, // dữ liệu bên trong token
      process.env.JWT_SECRET, //secret key chỉ server biết để verify token
      { expiresIn: '1d' } // hết hạn sau 1 ngày
    );

    //trả về res
    res.json({
      token, // token để client lưu 

      //Trả thông tin user
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

