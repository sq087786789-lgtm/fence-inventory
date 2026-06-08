require('dotenv').config();
const pool = require('./db');

const initDB = async () => {
  const client = await pool.connect();
  try {
    // 配件分類
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 配件（商品）
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        unit VARCHAR(20) NOT NULL DEFAULT '個',
        price DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 庫存（每個配件的庫存量）
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        product_id INTEGER UNIQUE REFERENCES products(id) ON DELETE CASCADE,
        quantity DECIMAL(10,2) DEFAULT 0,
        min_quantity DECIMAL(10,2) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 訂單
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_no VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(100),
        total_amount DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 訂單明細
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity DECIMAL(10,2) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL
      )
    `);

    // 進貨記錄
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_records (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        quantity DECIMAL(10,2) NOT NULL,
        price DECIMAL(10,2),
        supplier VARCHAR(200),
        notes TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 使用者
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✓ 資料庫結構建立完成');
  } catch (err) {
    console.error('資料庫初始化錯誤:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

initDB().then(() => process.exit(0)).catch(() => process.exit(1));
