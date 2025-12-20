const { v4: uuid } = require('uuid');
const Schedule = require('../models/schedule.model');

//=====================
// GET /api/v1/schedules?doctorId=...&date=YYYY-MM-DD
// Patient dùng để xem slot trống theo bác sĩ và ngày
//=====================
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    // validate input cơ bản
    if (!doctorId || !date) {
      return res.status(400).json({ error: 'Missing doctorId or date' });
    }

    const slots = await Schedule.findAvailableByDoctorAndDate(doctorId, date);
    res.json(slots);
  } catch (err) {
    console.error('GET AVAILABLE SLOTS ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

//=====================
// GET /api/v1/schedules/me?date=YYYY-MM-DD
// Doctor xem slot của chính mình theo ngày (có cả slot đã unavailable)
//=====================
exports.getMySchedulesByDate = async (req, res) => {
  try {
    // req.user.doctorId lấy từ JWT payload sau login
    const doctorId = req.user.doctorId;
    const { date } = req.query;

    if (!doctorId) {
      return res.status(400).json({ error: 'Missing doctorId in token' });
    }
    if (!date) {
      return res.status(400).json({ error: 'Missing date query' });
    }

    const slots = await Schedule.findByDoctorAndDate(doctorId, date);
    res.json(slots);
  } catch (err) {
    console.error('GET MY SCHEDULES ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

//=====================
// POST /api/v1/schedules
// Doctor tạo slot mới
// Body: { date, startTime, endTime }
//=====================
exports.createSchedule = async (req, res) => {
  try {
    const doctorId = req.user.doctorId; // doctorId trong token
    const { date, startTime, endTime } = req.body;

    // 1) validate
    if (!doctorId) {
      return res.status(400).json({ error: 'Missing doctorId in token' });
    }
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing date/startTime/endTime' });
    }

    // 2) validate time logic (start < end)
    if (startTime >= endTime) {
      return res.status(400).json({ error: 'Invalid time range' });
    }

    // 3) check overlap để tránh trùng ca
    const isOverlap = await Schedule.existsOverlap({ doctorId, date, startTime, endTime });
    if (isOverlap) {
      // 409 Conflict hợp lý hơn 400 vì bị trùng slot
      return res.status(409).json({ error: 'Schedule overlaps with existing slot' });
    }

    // 4) insert
    const id = uuid();
    await Schedule.create({ id, doctorId, date, startTime, endTime });

    res.status(201).json({ message: 'Schedule created', id });
  } catch (err) {
    console.error('CREATE SCHEDULE ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

//=====================
// PUT /api/v1/schedules/:id/cancel
// Doctor huỷ slot (chỉ huỷ được khi slot còn available)
//=====================
exports.cancelSchedule = async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    const scheduleId = req.params.id;

    if (!doctorId) {
      return res.status(400).json({ error: 'Missing doctorId in token' });
    }

    const affected = await Schedule.cancelIfAvailable(scheduleId, doctorId);

    if (!affected) {
      // Không huỷ được vì: không tồn tại, không thuộc doctor, hoặc slot đã unavailable
      return res.status(409).json({ error: 'Cannot cancel this schedule' });
    }

    res.json({ message: 'Schedule cancelled' });
  } catch (err) {
    console.error('CANCEL SCHEDULE ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
