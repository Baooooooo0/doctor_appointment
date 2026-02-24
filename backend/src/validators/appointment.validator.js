const { body } = require('express-validator');

/**
 * Rules cho POST /api/v1/appointments
 * - doctorId, scheduleId: bắt buộc, phải là UUID hợp lệ
 */
exports.createAppointmentRules = [
    body('doctorId')
        .notEmpty().withMessage('doctorId là bắt buộc')
        .isUUID().withMessage('doctorId phải là UUID hợp lệ'),

    body('scheduleId')
        .notEmpty().withMessage('scheduleId là bắt buộc')
        .isUUID().withMessage('scheduleId phải là UUID hợp lệ')
];

/**
 * Rules cho POST /api/v1/reviews
 * - appointmentId: UUID
 * - rating: số nguyên 1–5
 * - comment: optional, tối đa 1000 ký tự
 */
exports.createReviewRules = [
    body('appointmentId')
        .notEmpty().withMessage('appointmentId là bắt buộc')
        .isUUID().withMessage('appointmentId phải là UUID hợp lệ'),

    body('rating')
        .notEmpty().withMessage('rating là bắt buộc')
        .isInt({ min: 1, max: 5 }).withMessage('rating phải là số nguyên từ 1 đến 5'),

    body('comment')
        .optional({ nullable: true })
        .isLength({ max: 1000 }).withMessage('comment tối đa 1000 ký tự')
        .trim()
];

/**
 * Rules cho POST /api/v1/schedules
 * - date: YYYY-MM-DD
 * - startTime, endTime: HH:MM:SS
 */
exports.createScheduleRules = [
    body('date')
        .notEmpty().withMessage('date là bắt buộc')
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('date phải theo định dạng YYYY-MM-DD'),

    body('startTime')
        .notEmpty().withMessage('startTime là bắt buộc')
        .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('startTime phải theo định dạng HH:MM hoặc HH:MM:SS'),

    body('endTime')
        .notEmpty().withMessage('endTime là bắt buộc')
        .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('endTime phải theo định dạng HH:MM hoặc HH:MM:SS')
];

/**
 * Rules cho POST /api/v1/schedules/bulk
 * - slots: phải là array, không được rỗng
 * - mỗi slot trong slots phải có date, startTime, endTime đúng format
 */
exports.createBulkScheduleRules = [
    body('slots')
        .isArray({ min: 1 }).withMessage('slots phải là mảng có ít nhất 1 phần tử'),

    body('slots.*.date')
        .notEmpty().withMessage('Mỗi slot phải có date')
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('date phải theo định dạng YYYY-MM-DD'),

    body('slots.*.startTime')
        .notEmpty().withMessage('Mỗi slot phải có startTime')
        .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('startTime phải theo định dạng HH:MM hoặc HH:MM:SS'),

    body('slots.*.endTime')
        .notEmpty().withMessage('Mỗi slot phải có endTime')
        .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('endTime phải theo định dạng HH:MM hoặc HH:MM:SS')
];
