const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/notification.controller');

//Lấy danh sách notification của chính mình
router.get('/', auth(), controller.getMyNotifications);

//Đánh dấu 1 cái là đã đọc
router.put('/:id/read', auth(), controller.markOneRead);

//Đánh dấu tất cả là đã đọc
router.put('/read-all', auth(), controller.markAllRead);

//Tạo notification (thường chỉ admin)
router.post('/', auth(['ADMIN']), controller.createNotification);

module.exports = router;
