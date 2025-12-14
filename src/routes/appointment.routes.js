const router = require('express').Router(); //Tạo một router riêng
const auth = require('../middlewares/auth.middleware'); //Import middleware xác thực & phân quyền
const controller = require('../controllers/appointment.controller'); //Import controller xử lý logic

//Route tạo appointment
//khi client gọi POST /appointments->Request vào /appointments->Chạy auth(['PATIENT'])->Có token không?/Token hợp lệ không?/Role có phải PATIENT không?
//❌ sai → 401 / 403->nếu OK → chạy createAppointment
//Chỉ bệnh nhân mới được tạo lịch hẹn
router.post(
  '/',
  auth(['PATIENT']),
  controller.createAppointment
);

//Route xác nhận lịch hẹn (PUT /:id/confirm), :id → appointmentId, Chỉ DOCTOR mới được xác nhận lịch
//Luồng: PUT /appointments/123/confirm -> auth(['DOCTOR'])-> controller.confirm
router.put('/:id/confirm', auth(['DOCTOR']), controller.confirm);

//Route từ chối lịch hẹn, Doctor từ chối lịch, Không cho bệnh nhân gọi route này
router.put('/:id/reject', auth(['DOCTOR']), controller.reject);

//Route hoàn thành lịch hẹn, Doctor đánh dấu buổi khám đã xong
router.put('/:id/complete', auth(['DOCTOR']), controller.complete);

module.exports = router;
