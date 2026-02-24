const rateLimit = require('express-rate-limit');

/**
 * ─── LOGIN: chống brute-force ────────────────────────────────
 * 10 lần / 15 phút / IP
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Quá nhiều lần đăng nhập. Thử lại sau 15 phút.' },
    handler: (req, res, next, options) => {
        console.warn(`[RATE LIMIT] Login blocked – IP: ${req.ip} – ${new Date().toISOString()}`);
        res.status(options.statusCode).json(options.message);
    }
});

/**
 * ─── REGISTER: chống spam tạo tài khoản ─────────────────────
 * 5 lần / 1 giờ / IP
 */
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Quá nhiều lần đăng ký. Thử lại sau 1 giờ.' }
});

/**
 * ─── APPOINTMENT: chống spam đặt lịch ───────────────────────
 * 20 lần / 15 phút / IP
 */
const appointmentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Quá nhiều request đặt lịch. Thử lại sau 15 phút.' }
});

/**
 * ─── REVIEW: chống spam đánh giá ────────────────────────────
 * 10 lần / 1 giờ / IP
 */
const reviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Quá nhiều đánh giá. Thử lại sau 1 giờ.' }
});

/**
 * ─── SCHEDULE: chống spam tạo slot ──────────────────────────
 * 30 lần / 15 phút / IP
 */
const scheduleLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Quá nhiều request tạo lịch. Thử lại sau 15 phút.' }
});

/**
 * ─── GENERAL: public read endpoints ─────────────────────────
 * 100 lần / 1 phút / IP
 */
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Quá nhiều request. Thử lại sau.' }
});

module.exports = {
    loginLimiter,
    registerLimiter,
    appointmentLimiter,
    reviewLimiter,
    scheduleLimiter,
    generalLimiter
};
