require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const seed = async () => {
  const client = await pool.connect();
  try {
    // 建立 admin 帳號
    const existing = await client.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
    if (!existing.rows.length) {
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD;
      if (!password || password.length < 12 || password.length > 128) throw new Error('首次部署請設定 12–128 字元的 ADMIN_PASSWORD');
      const hash = await bcrypt.hash(password, 10);
      await client.query(`INSERT INTO users (username,password,name,role) VALUES ($1,$2,'系統管理者','admin')`,[username,hash]);
    }

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
  } catch (err) {
    console.error('Seed錯誤:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = seed;
