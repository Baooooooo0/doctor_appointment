const router = require('express').Router();
const controller = require('../controllers/doctor.controller');

// Danh sách bác sĩ
router.get('/', controller.getAll);

// Bác sĩ có slot theo ngày
router.get('/available', controller.getAvailableByDate);

module.exports = router;
