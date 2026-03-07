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
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['PATIENT', 'DOCTOR', 'ADMIN']).withMessage('Role must be PATIENT, DOCTOR or ADMIN'),

    body('name')
        .optional()
        .isLength({ max: 100 }).withMessage('Max length is 100 characters')
        .trim(),

    // phone: optional, nếu gửi phải là số điện thoại hợp lệ
    body('phone')
        .optional({ nullable: true })
        .isMobilePhone('vi-VN').withMessage('Invalid mobile phone format'),

    // Chỉ validate dateOfBirth nếu có
    body('dateOfBirth')
        .optional({ nullable: true })
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('dateOfBirth must be YYYY-MM-DD format'),

    // gender: chỉ nhận 3 giá trị
    body('gender')
        .optional({ nullable: true })
        .isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('gender must be MALE, FEMALE, or OTHER'),

    // experienceYears phải là số nguyên không âm
    body('experienceYears')
        .optional({ nullable: true })
        .isInt({ min: 0 }).withMessage('experienceYears must be an integer >= 0')
];

/**
 * Rules cho POST /api/v1/auth/login
 * - email và password: bắt buộc, validate cơ bản
 */
exports.loginRules = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
];

/**
 * Rules cho POST /api/v1/auth/refresh
 * - refreshToken: bắt buộc, phải là string
 */
exports.refreshRules = [
    body('refreshToken')
        .notEmpty().withMessage('refreshToken is required')
        .isString().withMessage('refreshToken must be a string')
];
