const pool = require('../config/db'); //connection pool MySQL
const { v4: uuid } = require('uuid'); //tạo id duy nhất cho appointment

//lay du lieu tu req 
exports.createAppointment = async (req, res) => {
  const { doctorId, scheduleId } = req.body; //lay doctorId va scheduleId tu frontend
  const patientId = req.user.patientId; //lay patientId tu JWT middleware

  //lay connection rieng tu pool de chuan bi dung transaction, khong dung connection chung
  const conn = await pool.getConnection();
  try {
    //bat dau transaction
    //Từ đây trở đi:
      // Mọi query chưa ghi hẳn vào DB
      // Chỉ khi commit() thì mới lưu
      // Có lỗi → rollback() → DB quay lại trạng thái cũ
    await conn.beginTransaction(); 

    //Tìm schedule theo scheduleId -> Chỉ lấy schedule còn trống (is_available = TRUE) -> FOR UPDATE → khóa row này
    // FOR UPDATE: Request khác không thể đọc/ghi row này cho tới khi transaction hiện tại kết thúc -> Tránh 2 người đặt cùng 1 lịch
    const [schedules] = await conn.query(
      'SELECT * FROM schedules WHERE id = ? AND is_available = TRUE FOR UPDATE',
      [scheduleId]
    );

    //Kiểm tra schedule có hợp lệ không
    //Không tìm thấy schedule -> Ném lỗi → nhảy xuống catch → rollback
    if (!schedules.length) throw new Error('Schedule not available');

    //Lấy dữ liệu schedule
    const schedule = schedules[0]; //Vì id là unique, Lấy phần tử đầu tiên

    //Tạo appointment mới
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

    //Đánh dấu schedule đã bị đặt
    await conn.query(
      'UPDATE schedules SET is_available = FALSE WHERE id = ?',
      [scheduleId]
    );

    //Insert appointment & Update schedule, Nếu 1 trong 2 fail → không có gì được ghi
    await conn.commit();
    res.json({ message: 'Appointment created' });
  } catch (err) {
    await conn.rollback(); //Nếu có lỗi (Schedule không available, Lỗi SQL, ...) → rollback
    res.status(400).json({ error: err }); //request không hợp lệ
  } finally {
    conn.release();//giải phóng connection
  }
};
