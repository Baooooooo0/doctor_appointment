/**
 * Middleware: Kiểm tra quyền theo role (Authorization)
 * - Phải chạy SAU authenticate (cần req.user đã được gắn)
 * - Nhận nhiều role: authorize('DOCTOR', 'ADMIN')
 * - Trả 403 nếu role không phù hợp
 *
 * Cách dùng:
 *   router.get('/me', authenticate, authorize('DOCTOR'), controller.getMe)
 *   router.get('/',   authenticate, authorize('ADMIN', 'DOCTOR'), controller.list)
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        // req.user được gắn bởi authenticate middleware trước đó
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Kiểm tra role của user có nằm trong danh sách cho phép không
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        next();
    };
};

module.exports = authorize;
