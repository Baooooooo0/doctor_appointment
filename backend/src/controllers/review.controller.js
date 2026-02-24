const { v4: uuid } = require('uuid');
const pool = require('../config/db');

const Review = require('../models/review.model');

//Tạo review (PATIENT)
//Luồng:
//1) Lấy appointmentId + rating + comment từ body
//2) Lấy patientId từ req.user (do auth middleware gắn vào)
//3) Check appointment có tồn tại + thuộc patient này + status đã COMPLETED chưa
//4) Check appointment đã review chưa
//5) Insert review
exports.createReview = async (req, res) => {
  const { appointmentId, rating, comment } = req.body;

  //req.user được middleware auth gắn vào (decoded token)
  //Bạn cần đảm bảo payload token có patientId, hoặc bạn query patientId theo userId
  const patientId = req.user.patientId;

  //1. Validate input
  if (!appointmentId || rating === undefined) {
    return res.status(400).json({ error: 'Missing appointmentId or rating' });
  }

  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Rating must be integer 1..5' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    //2. Lấy appointment (lock nhẹ để tránh race review trùng)
    const [apps] = await conn.query(
      `SELECT id, patient_id, doctor_id, status
       FROM appointments
       WHERE id = ?
       FOR UPDATE`,
      [appointmentId]
    );

    if (!apps.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = apps[0];

    //3. Check appointment thuộc patient đang login
    if (appointment.patient_id !== patientId) {
      await conn.rollback();
      return res.status(403).json({ error: 'You cannot review this appointment' });
    }

    //4. Chỉ cho review khi đã khám xong
    //Bạn sửa theo đúng enum/status bạn đang dùng
    if (appointment.status !== 'COMPLETED') {
      await conn.rollback();
      return res.status(400).json({ error: 'Appointment not completed yet' });
    }

    //5. Check đã review chưa
    const [existing] = await conn.query(
      'SELECT id FROM reviews WHERE appointment_id = ? LIMIT 1',
      [appointmentId]
    );
    if (existing.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'This appointment already reviewed' });
    }

    //6. Insert review
    await conn.query(
      `INSERT INTO reviews (id, appointment_id, patient_id, doctor_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuid(),
        appointmentId,
        patientId,
        appointment.doctor_id,
        ratingNum,
        comment || null
      ]
    );

    await conn.commit();
    res.status(201).json({ message: 'Review created' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Server error', detail: String(err) });
  } finally {
    conn.release();
  }
};

//Lấy reviews của 1 doctor (public hoặc cần auth tuỳ bạn)
//Luồng:
//1) Nhận doctorId từ params
//2) Query list review + stats
exports.getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const reviews = await Review.findByDoctorId(doctorId);
    const stats = await Review.getDoctorStats(doctorId);

    res.json({
      doctorId,
      stats: {
        totalReviews: Number(stats?.totalReviews || 0),
        avgRating: stats?.avgRating ? Number(stats.avgRating) : null
      },
      reviews
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: String(err) });
  }
};
