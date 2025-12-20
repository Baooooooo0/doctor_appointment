const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/patient.controller');

// Patient đã login mới vào được
router.get('/me', auth(['PATIENT']), controller.getMe);
router.put('/me', auth(['PATIENT']), controller.updateMe);

// OPTIONAL: doctor, admin xem profile theo patientId
router.get('/:id', auth(['ADMIN, DOCTOR']), controller.getById);

module.exports = router;
