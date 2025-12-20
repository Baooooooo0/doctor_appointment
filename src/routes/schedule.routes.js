const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/schedule.controller');

// Patient xem slot trống theo doctor + date
router.get('/', controller.getAvailableSlots);

// Doctor xem slot của mình theo ngày
router.get('/me', auth(['DOCTOR']), controller.getMySchedulesByDate);

// Doctor tạo slot
router.post('/', auth(['DOCTOR']), controller.createSchedule);

// Doctor huỷ slot
router.put('/:id/cancel', auth(['DOCTOR']), controller.cancelSchedule);

module.exports = router;
