const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/appointment.controller');

/**
 * POST /api/v1/appointments
 * Patient đặt lịch
 */
router.post('/', auth(['PATIENT']), controller.createAppointment);

/**
 * Doctor xử lý appointment
 */
router.put('/:id/confirm', auth(['DOCTOR']), controller.confirm);
router.put('/:id/reject', auth(['DOCTOR']), controller.reject);
router.put('/:id/complete', auth(['DOCTOR']), controller.complete);

/**
 * Optional: lấy lịch của chính mình
 */
router.get('/me', auth(['PATIENT', 'DOCTOR']), controller.getMyAppointments);

module.exports = router;
