const router = require('express').Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const validate = require('../middlewares/validate.middleware');
const { reviewLimiter } = require('../middlewares/ratelimit.middleware');
const { createReviewRules } = require('../validators/appointment.validator');
const controller = require('../controllers/review.controller');

// PATIENT tạo review cho appointment đã COMPLETED (rate limited: 10 req / 1 giờ)
router.post('/', reviewLimiter, authenticate, authorize('PATIENT'), createReviewRules, validate, controller.createReview);

// Public: xem review của doctor
router.get('/doctor/:doctorId', controller.getDoctorReviews);

module.exports = router;
