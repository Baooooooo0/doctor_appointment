const pool = require('../config/db');
const { v4: uuid } = require('uuid');

const Appointment = require('../models/appointment.model');
// Nếu bạn có schedule.model thì import để dùng cho gọn.
// const Schedule = require('../models/schedule.model');

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED'];

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
    await Appointment.insertWithConn(conn, {
      id: uuid(),
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

    return res.status(201).json({ message: 'Appointment created' });
  } catch (err) {
    /**
     * Nếu có lỗi ở bất cứ bước nào -> rollback để DB không bị “dở dang”
     */
    await conn.rollback();

    return res.status(400).json({ error: err });
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
  return res.json({ message: 'Appointment completed' });
};

/**
 * (Optional) GET /api/v1/appointments/me
 * - Nếu role PATIENT: trả lịch của patient
 * - Nếu role DOCTOR: trả lịch của doctor
 */
exports.getMyAppointments = async (req, res) => {
  const { role, patientId, doctorId } = req.user;

  if (role === 'PATIENT') {
    const rows = await Appointment.findByPatientId(patientId);
    return res.json(rows);
  }

  if (role === 'DOCTOR') {
    const rows = await Appointment.findByDoctorId(doctorId);
    return res.json(rows);
  }

  return res.status(403).json({ error: 'Role not supported' });
};
