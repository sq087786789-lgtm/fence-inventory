const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// GET /api/inventory - 取得庫存列表
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.sku, p.name, p.unit, p.price,
             c.name as category_name,
             i.quantity, i.min_quantity, i.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      ORDER BY p.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/low-stock - 低庫存警示
router.get('/low-stock', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.sku, p.name, p.unit,
             i.quantity, i.min_quantity
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      WHERE i.quantity <= i.min_quantity
      ORDER BY i.quantity ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/inventory/:productId - 更新庫存（手動調整）
router.put('/:productId', async (req, res) => {
  const { quantity, min_quantity } = req.body;
  try {
    const result = await pool.query(`
      UPDATE inventory SET quantity=$1, min_quantity=$2, updated_at=NOW()
      WHERE product_id=$3 RETURNING *
    `, [quantity, min_quantity || 0, req.params.productId]);
    if (result.rows.length === 0) return res.status(404).json({ error: '找不到商品' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
