const { v4: uuid } = require('uuid');
const pool = require('../config/db');
const Notification = require('../models/notification.model');

/**
 * Gửi notification tới 1 user (theo users.id)
 * Wrapped try-catch: notification thất bại KHÔNG làm crash luồng chính
 */
async function notify(userId, title, content, type = 'APPOINTMENT') {
    try {
        await Notification.create({
            id: uuid(),
            user_id: userId,
            title,
            content,
            type,
            is_read: 0
        });
    } catch (err) {
        // Log nhưng không throw – notification là phụ, không được làm hỏng business logic
        console.error('[NOTIFY ERROR]', err.message);
    }
}

/**
 * Lấy user_id từ patient_id (bảng patients → users)
 */
async function getUserIdByPatientId(patientId) {
    const [rows] = await pool.query(
        'SELECT user_id FROM patients WHERE id = ?', [patientId]
    );
    return rows[0]?.user_id || null;
}

/**
 * Lấy user_id từ doctor_id (bảng doctors → users)
 */
async function getUserIdByDoctorId(doctorId) {
    const [rows] = await pool.query(
        'SELECT user_id FROM doctors WHERE id = ?', [doctorId]
    );
    return rows[0]?.user_id || null;
}

// ─── Các sự kiện cụ thể ────────────────────────────────────────

/**
 * Bệnh nhân vừa đặt lịch → Thông báo cho BÁC SĨ
 */
exports.onAppointmentCreated = async ({ doctorId, date, startTime }) => {
    const userId = await getUserIdByDoctorId(doctorId);
    if (!userId) return;
    await notify(
        userId,
        '📅 Lịch hẹn mới',
        `Bạn có lịch hẹn mới vào ${date} lúc ${startTime}. Vui lòng xác nhận.`
    );
};

/**
 * Doctor xác nhận → Thông báo cho BỆNH NHÂN
 */
exports.onAppointmentConfirmed = async ({ patientId, date, startTime }) => {
    const userId = await getUserIdByPatientId(patientId);
    if (!userId) return;
    await notify(
        userId,
        '✅ Lịch hẹn đã được xác nhận',
        `Lịch hẹn ngày ${date} lúc ${startTime} đã được bác sĩ xác nhận.`
    );
};

/**
 * Doctor từ chối → Thông báo cho BỆNH NHÂN
 */
exports.onAppointmentRejected = async ({ patientId, date, startTime }) => {
    const userId = await getUserIdByPatientId(patientId);
    if (!userId) return;
    await notify(
        userId,
        '❌ Lịch hẹn bị từ chối',
        `Lịch hẹn ngày ${date} lúc ${startTime} đã bị từ chối. Vui lòng đặt lại.`
    );
};

/**
 * Doctor hoàn thành khám → Thông báo cho BỆNH NHÂN (nhắc để lại review)
 */
exports.onAppointmentCompleted = async ({ patientId, date }) => {
    const userId = await getUserIdByPatientId(patientId);
    if (!userId) return;
    await notify(
        userId,
        '🩺 Khám hoàn thành',
        `Buổi khám ngày ${date} đã hoàn thành. Hãy để lại đánh giá cho bác sĩ nhé!`
    );
};

/**
 * Bệnh nhân huỷ → Thông báo cho BÁC SĨ
 */
exports.onAppointmentCancelled = async ({ doctorId, date, startTime }) => {
    const userId = await getUserIdByDoctorId(doctorId);
    if (!userId) return;
    await notify(
        userId,
        '🚫 Lịch hẹn bị huỷ',
        `Bệnh nhân đã huỷ lịch hẹn ngày ${date} lúc ${startTime}. Slot đã mở lại.`
    );
};
