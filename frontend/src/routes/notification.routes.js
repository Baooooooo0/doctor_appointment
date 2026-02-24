const router = require('express').Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const controller = require('../controllers/notification.controller');

// Mọi user đã đăng nhập đều xem được notification của mình
router.get('/', authenticate, controller.getMyNotifications);
router.put('/:id/read', authenticate, controller.markOneRead);
router.put('/read-all', authenticate, controller.markAllRead);

// Chỉ ADMIN mới tạo notification thủ công
router.post('/', authenticate, authorize('ADMIN'), controller.createNotification);

module.exports = router;
