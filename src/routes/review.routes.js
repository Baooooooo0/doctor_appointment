const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const controller = require('../controllers/review.controller');

//PATIENT tạo review cho 1 appointment đã hoàn thành
//POST /api/v1/reviews
router.post('/', auth(['PATIENT']), controller.createReview);

//Public xem review của doctor
//GET /api/v1/reviews/doctor/:doctorId
router.get('/doctor/:doctorId', controller.getDoctorReviews);

module.exports = router;
