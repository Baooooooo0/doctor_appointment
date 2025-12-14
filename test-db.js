require('dotenv').config();
const pool = require('./src/config/db');

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    console.log('✅ KẾT NỐI MYSQL THÀNH CÔNG:', rows);
  } catch (error) {
    console.error('❌ KẾT NỐI MYSQL THẤT BẠI');
    console.error(error.message);
  } finally {
    process.exit();
  }
}

testConnection();
