const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// GET /api/products - 取得所有配件
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name, i.quantity, i.min_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id - 取得單一配件（含庫存）
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name, i.quantity, i.min_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '找不到' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products - 新增配件
router.post('/', async (req, res) => {
  const { sku, name, category_id, unit, price } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r1 = await client.query(
      `INSERT INTO products (sku, name, category_id, unit, price) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [sku, name, category_id, unit || '個', price || 0]
    );
    await client.query(`INSERT INTO inventory (product_id, quantity) VALUES ($1, 0)`, [r1.rows[0].id]);
    await client.query('COMMIT');
    res.json(r1.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  const { name, category_id, unit, price } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET name=$1, category_id=$2, unit=$3, price=$4 WHERE id=$5 RETURNING *`,
      [name, category_id, unit, price, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '找不到' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(`DELETE FROM products WHERE id=$1 RETURNING id`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '找不到' });
    res.json({ message: '已刪除' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
