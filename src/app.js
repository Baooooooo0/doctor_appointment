const express = require('express');
const cors = require('cors');//cho phép frontend gọi API từ domain khác

//Tạo instance của Express
// Tất cả request sẽ đi qua app
const app = express();

//Middleware dùng chung (chạy cho MỌI request)
//Cho phép: Frontend ở domain khác gọi API
//Tránh lỗi: Blocked by CORS policy
app.use(cors());

//Parse JSON body
app.use(express.json()); //Chuyển: { "email": "a@gmail.com" } thành: req.body.email

//Gắn các router (định tuyến API)
// Auth API: Mọi route trong auth.routes.js sẽ có prefix:/api/v1/auth/...
app.use('/api/v1/auth', require('./routes/auth.routes'));

// Patients API
app.use('/api/v1/patients', require('./routes/patient.routes'));

// Doctors API
app.use('/api/v1/doctors', require('./routes/doctor.routes'));

// Appointments API
app.use('/api/v1/appointments', require('./routes/appointment.routes'));

// Schedules API
app.use('/api/v1/schedules', require('./routes/schedule.routes'));

// Reviews API
app.use('/api/v1/reviews', require('./routes/review.routes'));

// Notifications API
app.use('/api/v1/notifications', require('./routes/notification.routes'));

module.exports = app;
