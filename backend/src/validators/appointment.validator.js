const { body } = require('express-validator');

/**
 * Rules cho POST /api/v1/appointments
 * - doctorId, scheduleId: bắt buộc, phải là UUID hợp lệ
 */
exports.createAppointmentRules = [
    body('doctorId')
        .notEmpty().withMessage('doctorId is required')
        .isUUID().withMessage('doctorId must be a valid UUID'),

    body('scheduleId')
        .notEmpty().withMessage('scheduleId is required')
        .isUUID().withMessage('scheduleId must be a valid UUID')
];

/**
 * Rules cho POST /api/v1/reviews
 * - appointmentId: UUID
 * - rating: số nguyên 1–5
 * - comment: optional, tối đa 1000 ký tự
 */
exports.createReviewRules = [
    body('appointmentId')
        .notEmpty().withMessage('appointmentId is required')
        .isUUID().withMessage('appointmentId must be a valid UUID'),

    body('rating')
        .notEmpty().withMessage('rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('rating must be an integer between 1 and 5'),

    body('comment')
        .optional({ nullable: true })
        .isLength({ max: 1000 }).withMessage('comment max length is 1000 characters')
        .trim()
];

/**
 * Rules cho POST /api/v1/schedules
 * - date: YYYY-MM-DD
 * - startTime, endTime: HH:MM:SS
 */
exports.createScheduleRules = [
    body('date')
        .notEmpty().withMessage('date is required')
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('date must be in YYYY-MM-DD format'),

    body('startTime')
        .notEmpty().withMessage('startTime is required')
        .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('startTime must be in HH:MM or HH:MM:SS format'),

    body('endTime')
        .notEmpty().withMessage('endTime is required')
        .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('endTime must be in HH:MM or HH:MM:SS format')
];

/**
 * Rules cho POST /api/v1/schedules/bulk
 * - slots: phải là array, không được rỗng
 * - mỗi slot trong slots phải có date, startTime, endTime đúng format
 */
exports.createBulkScheduleRules = [
    body('slots')
        .isArray({ min: 1 }).withMessage('slots must be an array with at least 1 item'),

    body('slots.*.date')
        .notEmpty().withMessage('Each slot must have a date')
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('date must be in YYYY-MM-DD format'),

    body('slots.*.startTime')
        .notEmpty().withMessage('Each slot must have a startTime')
        .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('startTime must be in HH:MM or HH:MM:SS format'),

    body('slots.*.endTime')
        .notEmpty().withMessage('Each slot must have an endTime')
        .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('endTime must be in HH:MM or HH:MM:SS format')
];
