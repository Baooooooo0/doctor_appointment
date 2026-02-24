const router = require('express').Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const { generalLimiter } = require('../middlewares/ratelimit.middleware');
const controller = require('../controllers/doctor.controller');

// Doctor: xem và cập nhật profile của chính mình
router.get('/me', authenticate, authorize('DOCTOR'), controller.getMe);
router.put('/me', authenticate, authorize('DOCTOR'), controller.updateMe);

// Public: danh sách bác sĩ (rate limited)
router.get('/', generalLimiter, controller.getAll);

// Public: tìm kiếm theo name và/hoặc specialty (rate limited)
router.get('/search', generalLimiter, controller.search);

// Public: bác sĩ có slot trống theo ngày (rate limited)
router.get('/available', generalLimiter, controller.getAvailableByDate);

module.exports = router;
