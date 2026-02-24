const router = require('express').Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const validate = require('../middlewares/validate.middleware');
const { scheduleLimiter } = require('../middlewares/ratelimit.middleware');
const { createScheduleRules, createBulkScheduleRules } = require('../validators/appointment.validator');
const controller = require('../controllers/schedule.controller');

// Public: patient xem slot trống theo doctor + date
router.get('/', controller.getAvailableSlots);

// Doctor xem slot của mình theo ngày
router.get('/me', authenticate, authorize('DOCTOR'), controller.getMySchedulesByDate);

// Doctor tạo 1 slot
router.post('/', scheduleLimiter, authenticate, authorize('DOCTOR'), createScheduleRules, validate, controller.createSchedule);

// Doctor tạo nhiều slot cùng lúc (bulk)
router.post('/bulk', scheduleLimiter, authenticate, authorize('DOCTOR'), createBulkScheduleRules, validate, controller.createBulkSchedule);

// Doctor huỷ slot
router.put('/:id/cancel', authenticate, authorize('DOCTOR'), controller.cancelSchedule);

module.exports = router;
