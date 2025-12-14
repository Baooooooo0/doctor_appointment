const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/patients', require('./routes/patient.routes'));
app.use('/api/v1/doctors', require('./routes/doctor.routes'));
app.use('/api/v1/appointments', require('./routes/appointment.routes'));
app.use('/api/v1/schedules', require('./routes/schedule.routes'));
app.use('/api/v1/reviews', require('./routes/review.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));

module.exports = app;
