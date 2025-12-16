const Doctor = require('../models/doctor.model');

// GET /api/v1/doctors
exports.getAll = async (req, res) => {
  try {
    //query lấy tất cả bác sĩ
    const doctors = await Doctor.findAll();
    res.json(doctors);
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
