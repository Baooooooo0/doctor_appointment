const { validationResult } = require('express-validator');

/**
 * Middleware tái sử dụng: chạy sau các express-validator checks
 * Nếu có lỗi validation → trả 422 với danh sách lỗi rõ ràng
 * Nếu không có lỗi → next() để tiếp tục vào controller
 *
 * Cách dùng trong route:
 *   router.post('/register', registerRules, validate, controller.register)
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Lấy danh sách lỗi gọn: [{ field, message }]
        const formatted = errors.array().map((err) => ({
            field: err.path,      // tên field bị lỗi
            message: err.msg      // thông báo lỗi
        }));

        return res.status(422).json({
            error: 'Validation failed',
            details: formatted
        });
    }

    next();
};

module.exports = validate;
