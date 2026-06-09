require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const seed = async () => {
  const client = await pool.connect();
  try {
    // 建立 admin 帳號
    const hash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (username, password, name, role)
      VALUES ('admin', $1, '系統管理者', 'admin')
      ON CONFLICT (username) DO NOTHING
    `, [hash]);

    // 建立預設分類
    await client.query(`
      INSERT INTO categories (name, description) VALUES
      ('鍍鋅管', '鍍鋅鋼管'),
      ('鐵絲網', '鐵絲網/焊接網'),
      ('螺絲配件', '螺絲、螺帽、墊片'),
      ('其他', '其他材料')
      ON CONFLICT DO NOTHING
    `);

    console.log('✓ 預設資料建立完成');
    console.log('  登入帳號: admin / admin123');
  } catch (err) {
    console.error('Seed錯誤:', err.message);
  } finally {
    client.release();
  }
};

module.exports = seed;
