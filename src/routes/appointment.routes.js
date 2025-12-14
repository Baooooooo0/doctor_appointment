const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/appointment.controller');

router.post(
  '/',
  auth(['PATIENT']),
  controller.createAppointment
);

router.put('/:id/confirm', auth(['DOCTOR']), controller.confirm);
router.put('/:id/reject', auth(['DOCTOR']), controller.reject);
router.put('/:id/complete', auth(['DOCTOR']), controller.complete);

module.exports = router;
