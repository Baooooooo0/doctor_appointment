require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function migrate() {
    const conn = await pool.getConnection();
    try {
        // 1) Thêm consultation_fee vào doctors
        try {
            await conn.query('ALTER TABLE doctors ADD COLUMN consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0');
            console.log('✅ Column consultation_fee added to doctors');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  consultation_fee already exists, skipping');
            } else throw e;
        }

        // 2) Cập nhật ENUM status trong appointments
        await conn.query(
            "ALTER TABLE appointments MODIFY COLUMN status ENUM('AWAITING_PAYMENT','PENDING','CONFIRMED','REJECTED','COMPLETED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'AWAITING_PAYMENT'"
        );
        console.log('✅ appointments.status ENUM updated');

        // 3) Tạo bảng payments
        await conn.query(
            "CREATE TABLE IF NOT EXISTS payments (" +
            "  id                  VARCHAR(36)   PRIMARY KEY," +
            "  appointment_id      VARCHAR(36)   NOT NULL UNIQUE," +
            "  amount              DECIMAL(10,2) NOT NULL," +
            "  vnp_txn_ref         VARCHAR(100)  NOT NULL," +
            "  vnp_transaction_no  VARCHAR(100)," +
            "  vnp_bank_code       VARCHAR(20)," +
            "  status              ENUM('PENDING','PAID','FAILED','REFUNDED') DEFAULT 'PENDING'," +
            "  refund_status       ENUM('NONE','PENDING','DONE')              DEFAULT 'NONE'," +
            "  expires_at          DATETIME      NOT NULL," +
            "  paid_at             DATETIME," +
            "  refunded_at         DATETIME," +
            "  created_at          DATETIME      DEFAULT NOW()," +
            "  FOREIGN KEY (appointment_id) REFERENCES appointments(id)" +
            ")"
        );
        console.log('✅ Table payments created (or already exists)');

        console.log('🎉 Migration complete!');
    } finally {
        conn.release();
        pool.end();
    }
}

migrate().catch(err => { console.error('❌ Migration failed:', err.message); process.exit(1); });
