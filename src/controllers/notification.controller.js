const { v4: uuid } = require('uuid');
const Notification = require('../models/notification.model');

//GET /api/v1/notifications?limit=20&offset=0
exports.getMyNotifications = async (req, res) => {
  try {
    //req.user được middleware auth gắn vào (decoded từ JWT)
    const userId = req.user.userId;

    //query params phân trang (tuỳ chọn)
    const limit = req.query.limit || 20;
    const offset = req.query.offset || 0;

    const items = await Notification.findByUserId(userId, limit, offset);
    const unread = await Notification.countUnread(userId);

    res.json({ unread, items });
  } catch (err) {
    console.error('GET NOTIFICATIONS ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

//PUT /api/v1/notifications/:id/read
exports.markOneRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    //markRead có điều kiện id + userId -> user không thể đọc notification của người khác
    const affected = await Notification.markRead(id, userId);

    if (!affected) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('MARK ONE READ ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

//PUT /api/v1/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const affected = await Notification.markAllRead(userId);
    res.json({ message: 'All marked as read', updated: affected });
  } catch (err) {
    console.error('MARK ALL READ ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /api/v1/notifications
 * Tạo notification (thường chỉ ADMIN hoặc SYSTEM dùng)
 * Nếu bạn chưa cần thì có thể bỏ route này.
 */
exports.createNotification = async (req, res) => {
  try {
    const { userId, title, content, type } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'Missing userId or content' });
    }

    const notification = {
      id: uuid(),
      user_id: userId,
      title: title || null,
      content,
      type: type || 'SYSTEM',
      is_read: 0
    };

    await Notification.create(notification);

    res.status(201).json({ message: 'Notification created' });
  } catch (err) {
    console.error('CREATE NOTIFICATION ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
