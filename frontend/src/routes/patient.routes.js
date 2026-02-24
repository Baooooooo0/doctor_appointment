const router = require('express').Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const { generalLimiter } = require('../middlewares/ratelimit.middleware');
const controller = require('../controllers/patient.controller');

// Patient xem và cập nhật profile của mình
router.get('/me', generalLimiter, authenticate, authorize('PATIENT'), controller.getMe);
router.put('/me', generalLimiter, authenticate, authorize('PATIENT'), controller.updateMe);

// ADMIN hoặc DOCTOR xem profile patient theo ID
router.get('/:id', generalLimiter, authenticate, authorize('ADMIN', 'DOCTOR'), controller.getById);

module.exports = router;
