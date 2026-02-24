require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function migrate() {
    const conn = await pool.getConnection();
    try {
        await conn.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id         VARCHAR(36)  PRIMARY KEY,
        user_id    VARCHAR(36)  NOT NULL,
        token      TEXT         NOT NULL,
        expires_at DATETIME     NOT NULL,
        created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        console.log('✅ Table refresh_tokens created (or already exists)');
    } finally {
        conn.release();
        process.exit(0);
    }
}

migrate().catch(err => { console.error('❌', err.message); process.exit(1); });
