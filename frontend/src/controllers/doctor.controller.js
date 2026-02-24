const Doctor = require('../models/doctor.model');
const { parsePagination, buildMeta } = require('../utils/pagination.util');

// GET /api/v1/doctors?page=1&limit=10
exports.getAll = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const [doctors, total] = await Promise.all([
      Doctor.findAll(limit, offset),
      Doctor.countAll()
    ]);
    res.json({ data: doctors, meta: buildMeta(total, page, limit) });
  } catch (err) {
    console.error('GET DOCTORS ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/v1/doctors/available?date=YYYY-MM-DD
exports.getAvailableByDate = async (req, res) => {
  try {
    //lấy thông tin về ngày của req 
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Missing date query' }); // trả về 400 bad request
    }

    //gọi model để viết sql, join doctors, schedules, users, đếm slot trống
    const doctors = await Doctor.findAvailableByDate(date);
    //trả về json các bác sĩ của ngày đó 
    res.json(doctors);
  } catch (err) {
    console.error('GET AVAILABLE DOCTORS ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/v1/doctors/search?name=&specialty=
// Public: tìm kiếm bác sĩ theo tên và/hoặc chuyên khoa
exports.search = async (req, res) => {
  try {
    const { name, specialty } = req.query;

    // Gọi model với filter (cả hai đều optional)
    const doctors = await Doctor.search({ name, specialty });
    res.json(doctors);
  } catch (err) {
    console.error('SEARCH DOCTORS ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/v1/doctors/me
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id; // từ JWT middleware

    const doctor = await Doctor.findMe(userId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    res.json(doctor);
  } catch (err) {
    console.error('GET DOCTOR ME ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/v1/doctors/me
exports.updateMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const { specialty, experienceYears, description } = req.body;

    const updated = await Doctor.updateMe(userId, {
      specialty,
      experienceYears,
      description,
    });

    res.json({ message: 'Updated', doctor: updated });
  } catch (err) {
    console.error('UPDATE DOCTOR ME ERROR:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

