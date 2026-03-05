const pool = require('../config/db');
const { v4: uuid } = require('uuid');
const Appointment = require('../models/appointment.model');
const NotifySvc = require('../services/notification.service');
const { parsePagination, buildMeta } = require('../utils/pagination.util');

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'];

/**
 * POST /api/v1/appointments
 * Patient đặt lịch: chọn doctorId + scheduleId
 */
exports.createAppointment = async (req, res) => {
  // doctorId + scheduleId từ client gửi lên
  const { doctorId, scheduleId } = req.body;

  // patientId lấy từ token (middleware auth gắn vào req.user)
  const patientId = req.user.patientId;

  // Validate nhanh input
  if (!doctorId || !scheduleId) {
    return res.status(400).json({ error: 'Missing doctorId or scheduleId' });
  }
  if (!patientId) {
    // trường hợp token không có patientId -> lỗi logic auth/login
    return res.status(401).json({ error: 'Missing patientId in token' });
  }

  // Lấy connection để làm transaction (đảm bảo đặt lịch an toàn)
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    /**
     * 1) LOCK schedule bằng FOR UPDATE
     * - Mục tiêu: nếu 2 người cùng đặt 1 slot, chỉ 1 người thắng
     * - is_available = TRUE: chỉ slot còn trống mới đặt được
     */
    const [schedules] = await conn.query(
      'SELECT * FROM schedules WHERE id = ? AND is_available = TRUE FOR UPDATE',
      [scheduleId]
    );

    // Nếu không có record => slot không tồn tại hoặc đã bị đặt
    if (!schedules.length) {
      // throw string để catch bắt và trả về 400
      throw 'Schedule not available';
    }

    const schedule = schedules[0];

    /**
     * 2) (Optional) check doctorId có khớp schedule.doctor_id không
     * -> tránh client gửi doctorId khác scheduleId
     */
    if (schedule.doctor_id && schedule.doctor_id !== doctorId) {
      throw 'Schedule does not belong to this doctor';
    }

    /**
     * 3) Insert appointment
     * - Lưu date/time theo schedule để tránh client “tự chế” giờ
     */
    const appointmentId = uuid();
    await Appointment.insertWithConn(conn, {
      id: appointmentId,
      patientId,
      doctorId: schedule.doctor_id || doctorId, // ưu tiên từ schedule
      scheduleId,
      date: schedule.date,
      startTime: schedule.start_time,
      endTime: schedule.end_time
    });

    /**
     * 4) Đánh dấu schedule đã bị chiếm
     */
    await conn.query(
      'UPDATE schedules SET is_available = FALSE WHERE id = ?',
      [scheduleId]
    );

    /**
     * 5) Commit transaction: mọi thứ OK
     */
    await conn.commit();

    // Gửi notification cho doctor (fire-and-forget, không ảnh hưởng response)
    NotifySvc.onAppointmentCreated({
      doctorId: schedule.doctor_id || doctorId,
      date: schedule.date,
      startTime: schedule.start_time
    });

    return res.status(201).json({ message: 'Appointment created', id: appointmentId });
  } catch (err) {
    /**
     * Nếu có lỗi ở bất cứ bước nào -> rollback để DB không bị “dở dang”
     */
    await conn.rollback();

    // Map lỗi sang thông báo thân thiện
    if (typeof err === 'string') {
      // String throw từ validation bên trên (vd: 'Schedule not available')
      return res.status(400).json({ error: err });
    }
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This slot has already been booked. Please choose another slot.' });
    }
    // Lỗi DB khác -> log nội bộ, không expose ra ngoài
    console.error('CREATE APPOINTMENT ERROR:', err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  } finally {
    conn.release();
  }
};

/**
 * PUT /api/v1/appointments/:id/confirm
 * Doctor xác nhận lịch
 */
exports.confirm = async (req, res) => {
  const { id } = req.params;

  // doctorId lấy từ token
  const doctorId = req.user.doctorId; // hoặc req.user.userId nếu bạn chưa tách doctor table

  const appointment = await Appointment.findById(id);
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

  // Check appointment thuộc doctor đang login
  if (doctorId && appointment.doctor_id !== doctorId) {
    return res.status(403).json({ error: 'Not your appointment' });
  }

  // Chỉ confirm khi đang pending
  if (appointment.status !== 'PENDING') {
    return res.status(400).json({ error: `Cannot confirm when status is ${appointment.status}` });
  }

  await Appointment.updateStatus(id, 'CONFIRMED');

  // Thông báo bệnh nhân
  NotifySvc.onAppointmentConfirmed({
    patientId: appointment.patient_id,
    date: appointment.date,
    startTime: appointment.start_time
  });

  return res.json({ message: 'Appointment confirmed' });
};

/**
 * PUT /api/v1/appointments/:id/reject
 * Doctor từ chối lịch
 */
exports.reject = async (req, res) => {
  const { id } = req.params;
  const doctorId = req.user.doctorId;

  const appointment = await Appointment.findById(id);
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

  if (doctorId && appointment.doctor_id !== doctorId) {
    return res.status(403).json({ error: 'Not your appointment' });
  }

  if (appointment.status !== 'PENDING') {
    return res.status(400).json({ error: `Cannot reject when status is ${appointment.status}` });
  }

  // Làm reject + mở lại slot schedule trong transaction để chắc chắn
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      'UPDATE appointments SET status = ? WHERE id = ?',
      ['REJECTED', id]
    );

    // mở lại slot để người khác đặt
    await conn.query(
      'UPDATE schedules SET is_available = TRUE WHERE id = ?',
      [appointment.schedule_id]
    );

    await conn.commit();

    // Thông báo bệnh nhân
    NotifySvc.onAppointmentRejected({
      patientId: appointment.patient_id,
      date: appointment.date,
      startTime: appointment.start_time
    });

    return res.json({ message: 'Appointment rejected' });
  } catch (err) {
    await conn.rollback();
    return res.status(400).json({ error: err });
  } finally {
    conn.release();
  }
};

/**
 * PUT /api/v1/appointments/:id/complete
 * Doctor hoàn thành khám
 */
exports.complete = async (req, res) => {
  const { id } = req.params;
  const doctorId = req.user.doctorId;

  const appointment = await Appointment.findById(id);
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

  if (doctorId && appointment.doctor_id !== doctorId) {
    return res.status(403).json({ error: 'Not your appointment' });
  }

  // Thường chỉ complete khi confirmed
  if (appointment.status !== 'CONFIRMED') {
    return res.status(400).json({ error: `Cannot complete when status is ${appointment.status}` });
  }

  await Appointment.updateStatus(id, 'COMPLETED');

  // Nhắc bệnh nhân để lại review
  NotifySvc.onAppointmentCompleted({
    patientId: appointment.patient_id,
    date: appointment.date
  });

  return res.json({ message: 'Appointment completed' });
};

/**
 * (Optional) GET /api/v1/appointments/me
 * - Nếu role PATIENT: trả lịch của patient
 * - Nếu role DOCTOR: trả lịch của doctor
 */
exports.getMyAppointments = async (req, res) => {
  const { role, patientId, doctorId } = req.user;
  const { status } = req.query;
  const { page, limit, offset } = parsePagination(req.query);

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }

  if (role === 'PATIENT') {
    const [rows, total] = await Promise.all([
      Appointment.findByPatientId(patientId, status || null, limit, offset),
      Appointment.countByPatientId(patientId, status || null)
    ]);
    return res.json({ data: rows, meta: buildMeta(total, page, limit) });
  }

  if (role === 'DOCTOR') {
    const [rows, total] = await Promise.all([
      Appointment.findByDoctorId(doctorId, status || null, limit, offset),
      Appointment.countByDoctorId(doctorId, status || null)
    ]);
    return res.json({ data: rows, meta: buildMeta(total, page, limit) });
  }

  return res.status(403).json({ error: 'Role not supported' });
};

/**
 * PUT /api/v1/appointments/:id/cancel
 * Patient huỷ lịch (chỉ được huỷ khi status = PENDING)
 */
exports.cancel = async (req, res) => {
  const { id } = req.params;
  const patientId = req.user.patientId;

  if (!patientId) {
    return res.status(401).json({ error: 'Missing patientId in token' });
  }

  // 1) Tìm appointment
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  // 2) Kiểm tra appointment có thuộc patient này không
  if (appointment.patient_id !== patientId) {
    return res.status(403).json({ error: 'Not your appointment' });
  }

  // 3) Chỉ huỷ được khi đang PENDING
  if (appointment.status !== 'PENDING') {
    return res.status(400).json({
      error: `Cannot cancel when status is ${appointment.status}`
    });
  }

  // 4) Transaction: đổi status + mở lại slot
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      'UPDATE appointments SET status = ? WHERE id = ?',
      ['CANCELLED', id]
    );

    // Mở lại slot để bác sĩ/bệnh nhân khác có thể đặt
    await conn.query(
      'UPDATE schedules SET is_available = TRUE WHERE id = ?',
      [appointment.schedule_id]
    );

    await conn.commit();

    // Thông báo bác sĩ (slot đã mở lại)
    NotifySvc.onAppointmentCancelled({
      doctorId: appointment.doctor_id,
      date: appointment.date,
      startTime: appointment.start_time
    });

    return res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    await conn.rollback();
    return res.status(400).json({ error: err });
  } finally {
    conn.release();
  }
};
