const pool = require('../config/db');

/**
 * GET /api/v1/admin/users
 * Xem danh sách tất cả user (phân trang + search)
 * Query: ?page=1&limit=10&role=DOCTOR&search=Keyword
 */
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { role, search } = req.query;

        let query = `SELECT id, name, email, role, is_locked, created_at FROM users WHERE 1=1`;
        const params = [];

        if (role) {
            query += ` AND role = ?`;
            params.push(role);
        }

        if (search) {
            query += ` AND (name LIKE ? OR email LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [users] = await pool.query(query, params);

        // Tính tổng để phân trang
        let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
        const countParams = [];

        if (role) {
            countQuery += ` AND role = ?`;
            countParams.push(role);
        }
        if (search) {
            countQuery += ` AND (name LIKE ? OR email LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`);
        }

        const [[{ total }]] = await pool.query(countQuery, countParams);

        res.json({
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            users
        });
    } catch (err) {
        console.error('GET ALL USERS ERROR:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * PUT /api/v1/admin/users/:id/lock
 * Toggle trạng thái khóa tài khoản
 */
exports.toggleUserLock = async (req, res) => {
    try {
        const { id } = req.params;
        const { isLocked } = req.body; // client gửi true/false hoặc 1/0

        // Không cho tự khóa chính mình
        if (id === req.user.id) {
            return res.status(400).json({ error: 'Bạn không thể tự khóa tài khoản của chính mình' });
        }

        const [result] = await pool.query(
            'UPDATE users SET is_locked = ? WHERE id = ?',
            [isLocked ? 1 : 0, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User không tồn tại' });
        }

        res.json({ message: isLocked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản' });
    } catch (err) {
        console.error('TOGGLE LOCK ERROR:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * GET /api/v1/admin/stats
 * Thống kê nhanh hệ thống
 */
exports.getStats = async (req, res) => {
    try {
        const [[{ doctors }]] = await pool.query("SELECT COUNT(*) as doctors FROM doctors");
        const [[{ patients }]] = await pool.query("SELECT COUNT(*) as patients FROM patients");
        const [[{ appointments }]] = await pool.query("SELECT COUNT(*) as appointments FROM appointments");
        const [[{ revenue }]] = await pool.query("SELECT 0 as revenue"); // Placeholder cho Task thanh toán sau này

        res.json({
            counts: {
                doctors,
                patients,
                appointments,
                revenue
            }
        });
    } catch (err) {
        console.error('GET STATS ERROR:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
