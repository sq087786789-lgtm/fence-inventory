require('dotenv').config();
const db = require('./db');
const crypto = require('crypto');

const seed = () => {
  // 建立 admin 帳號（密碼：admin123）
  const passwordHash = crypto.createHash('sha256').update('admin123').digest('hex');
  try {
    db.prepare(`INSERT INTO users (username, password, name, role) VALUES (?,?,?,?)`).run('admin', passwordHash, '系統管理者', 'admin');
  } catch(e) {}

  // 預設分類
  const categories = [
    ['鍍鋅管', '鍍鋅鋼管'],
    ['鐵絲網', '鐵絲網/焊接網'],
    ['螺絲配件', '螺絲、螺帽、墊片'],
    ['其他', '其他材料']
  ];
  const insertCat = db.prepare(`INSERT OR IGNORE INTO categories (name, description) VALUES (?,?)`);
  for (const [name, desc] of categories) {
    insertCat.run(name, desc);
  }

  console.log('✓ 預設資料建立完成');
  console.log('  登入帳號: admin / admin123');
};

seed();
