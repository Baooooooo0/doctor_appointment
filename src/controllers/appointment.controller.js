const pool = require('../config/db');
const { v4: uuid } = require('uuid');

exports.createAppointment = async (req, res) => {
  const { doctorId, scheduleId } = req.body;
  const patientId = req.user.patientId;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // lock schedule
    const [schedules] = await conn.query(
      'SELECT * FROM schedules WHERE id = ? AND is_available = TRUE FOR UPDATE',
      [scheduleId]
    );
    if (!schedules.length) throw 'Schedule not available';

    const schedule = schedules[0];

    await conn.query(
      `INSERT INTO appointments 
      (id, patient_id, doctor_id, schedule_id, date, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid(),
        patientId,
        doctorId,
        scheduleId,
        schedule.date,
        schedule.start_time,
        schedule.end_time
      ]
    );

    await conn.query(
      'UPDATE schedules SET is_available = FALSE WHERE id = ?',
      [scheduleId]
    );

    await conn.commit();
    res.json({ message: 'Appointment created' });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err });
  } finally {
    conn.release();
  }
};
