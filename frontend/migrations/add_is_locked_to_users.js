require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function migrate() {
    const conn = await pool.getConnection();
    try {
        // Thêm cột is_locked nếu chưa tồn tại
        const [columns] = await conn.query("SHOW COLUMNS FROM users LIKE 'is_locked'");
        if (columns.length === 0) {
            await conn.query("ALTER TABLE users ADD COLUMN is_locked TINYINT(1) DEFAULT 0");
            console.log('✅ Column is_locked added to users table');
        } else {
            console.log('ℹ️ Column is_locked already exists');
        }
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        conn.release();
        process.exit(0);
    }
}

migrate();
