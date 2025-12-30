const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/doctor.controller');

// Doctor đã login mới vào được
router.get('/me', auth(['DOCTOR']), controller.getMe);
router.put('/me', auth(['DOCTOR']), controller.updateMe);

// Danh sách bác sĩ
router.get('/', controller.getAll);

// Bác sĩ có slot theo ngày
router.get('/available', controller.getAvailableByDate);

module.exports = router;
