const router = require('express').Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const validate = require('../middlewares/validate.middleware');
const { appointmentLimiter } = require('../middlewares/ratelimit.middleware');
const { createAppointmentRules } = require('../validators/appointment.validator');
const controller = require('../controllers/appointment.controller');

// Patient đặt lịch (rate limited: 20 req / 15 phút)
router.post('/', appointmentLimiter, authenticate, authorize('PATIENT'), createAppointmentRules, validate, controller.createAppointment);

// Doctor xử lý appointment
router.put('/:id/confirm', authenticate, authorize('DOCTOR'), controller.confirm);
router.put('/:id/reject', authenticate, authorize('DOCTOR'), controller.reject);
router.put('/:id/complete', authenticate, authorize('DOCTOR'), controller.complete);

// Patient huỷ lịch (chỉ khi PENDING)
router.put('/:id/cancel', authenticate, authorize('PATIENT'), controller.cancel);

// Xem lịch của chính mình (PATIENT hoặc DOCTOR)
router.get('/me', authenticate, authorize('PATIENT', 'DOCTOR'), controller.getMyAppointments);

module.exports = router;
