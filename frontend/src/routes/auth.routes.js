const router = require('express').Router();
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { loginLimiter, registerLimiter } = require('../middlewares/ratelimit.middleware');
const { registerRules, loginRules, refreshRules } = require('../validators/auth.validator');
const controller = require('../controllers/auth.controller');

// Đăng ký – trả về accessToken + refreshToken
router.post('/register', registerLimiter, registerRules, validate, controller.register);

// Đăng nhập – trả về accessToken + refreshToken
router.post('/login', loginLimiter, loginRules, validate, controller.login);

// Lấy accessToken mới bằng refreshToken
router.post('/refresh', loginLimiter, refreshRules, validate, controller.refresh);

// Đăng xuất – cần accessToken để biết user là ai
// Body: { refreshToken } hoặc { all: true }
router.post('/logout', authenticate, controller.logout);

module.exports = router;
