const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// GET /api/purchases
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pr.*, p.name as product_name, p.sku, u.name as created_by_name
      FROM purchase_records pr
      JOIN products p ON pr.product_id = p.id
      LEFT JOIN users u ON pr.created_by = u.id
      ORDER BY pr.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/purchases
router.post('/', async (req, res) => {
  const { product_id, quantity, price, supplier, notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `INSERT INTO purchase_records (product_id, quantity, price, supplier, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [product_id, quantity, price || 0, supplier, notes, req.user?.id || null]
    );
    await client.query(`
      UPDATE inventory SET quantity = quantity + $1, updated_at = NOW()
      WHERE product_id = $2
    `, [quantity, product_id]);
    await client.query('COMMIT');
    res.json(r.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
