const { body } = require('express-validator');

/**
 * Rules cho POST /api/v1/auth/register
 * - email, password, role: bắt buộc
 * - phone: optional nhưng nếu gửi phải đúng định dạng
 * - role: chỉ nhận PATIENT | DOCTOR | ADMIN
 * - Các field theo role (dateOfBirth, specialty…): optional
 */
exports.registerRules = [
    body('email')
        .notEmpty().withMessage('Email là bắt buộc')
        .isEmail().withMessage('Email không đúng định dạng')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password là bắt buộc')
        .isLength({ min: 6 }).withMessage('Password phải có ít nhất 6 ký tự'),

    body('role')
        .notEmpty().withMessage('Role là bắt buộc')
        .isIn(['PATIENT', 'DOCTOR', 'ADMIN']).withMessage('Role phải là PATIENT, DOCTOR hoặc ADMIN'),

    body('name')
        .optional()
        .isLength({ max: 100 }).withMessage('Tên tối đa 100 ký tự')
        .trim(),

    // phone: optional, nếu gửi phải là số điện thoại hợp lệ
    body('phone')
        .optional({ nullable: true })
        .isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),

    // Chỉ validate dateOfBirth nếu có
    body('dateOfBirth')
        .optional({ nullable: true })
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('dateOfBirth phải theo định dạng YYYY-MM-DD'),

    // gender: chỉ nhận 3 giá trị
    body('gender')
        .optional({ nullable: true })
        .isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('gender phải là MALE, FEMALE hoặc OTHER'),

    // experienceYears phải là số nguyên không âm
    body('experienceYears')
        .optional({ nullable: true })
        .isInt({ min: 0 }).withMessage('experienceYears phải là số nguyên >= 0')
];

/**
 * Rules cho POST /api/v1/auth/login
 * - email và password: bắt buộc, validate cơ bản
 */
exports.loginRules = [
    body('email')
        .notEmpty().withMessage('Email là bắt buộc')
        .isEmail().withMessage('Email không đúng định dạng')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password là bắt buộc')
];

/**
 * Rules cho POST /api/v1/auth/refresh
 * - refreshToken: bắt buộc, phải là string
 */
exports.refreshRules = [
    body('refreshToken')
        .notEmpty().withMessage('refreshToken là bắt buộc')
        .isString().withMessage('refreshToken phải là string')
];
