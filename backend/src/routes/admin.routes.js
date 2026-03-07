const router = require('express').Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const controller = require('../controllers/admin.controller');

// Tất cả route trong file này đều yêu cầu login + role ADMIN
router.use(authenticate, authorize('ADMIN'));

// Xem danh sách user
router.get('/users', controller.getAllUsers);

// Khóa/Mở khóa tài khoản
router.put('/users/:id/lock', controller.toggleUserLock);

// Thống kê
router.get('/stats', controller.getStats);

// Xem tất cả appointments
router.get('/appointments', controller.getAllAppointments);

module.exports = router;
