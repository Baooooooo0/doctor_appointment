const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Middleware: Xác thực JWT (Authentication)
 * - Kiểm tra token có tồn tại, hợp lệ, còn hạn không
 * - Gắn req.user = decoded payload để các middleware sau dùng
 * - KHÔNG kiểm tra role (việc đó để authorize.middleware làm)
 *
 * Cách dùng: router.get('/me', authenticate, authorize('DOCTOR'), controller.getMe)
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Phải có header Authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  // Chuẩn Bearer token: "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    // Verify chữ ký + hạn sử dụng
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // [New] Kiểm tra tài khoản có bị khóa không
    const [users] = await pool.query('SELECT is_locked FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0 || users[0].is_locked) {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa hoặc không tồn tại' });
    }

    req.user = decoded; // gắn payload vào req để controller & authorize dùng
    next();
  } catch (err) {
    // Token hết hạn hoặc sai chữ ký
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
