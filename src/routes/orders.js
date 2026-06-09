const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// GET /api/orders
router.get('/', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not configured' });
  try {
    const result = await pool.query(`
      SELECT o.*, u.name as created_by_name
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not configured' });
  try {
    const order = await pool.query(`SELECT * FROM orders WHERE id=$1`, [req.params.id]);
    if (order.rows.length === 0) return res.status(404).json({ error: '找不到訂單' });
    const items = await pool.query(`
      SELECT oi.*, p.name, p.sku, p.unit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [req.params.id]);
    res.json({ ...order.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders
router.post('/', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not configured' });
  const { customer_name, notes, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderNo = `ORD-${Date.now()}`;
    const o = await client.query(
      `INSERT INTO orders (order_no, customer_name, notes, created_by) VALUES ($1,$2,$3,$4) RETURNING *`,
      [orderNo, customer_name, notes, req.user?.id || null]
    );
    let total = 0;
    for (const item of items) {
      const subtotal = item.quantity * item.price;
      total += subtotal;
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES ($1,$2,$3,$4,$5)`,
        [o.rows[0].id, item.product_id, item.quantity, item.price, subtotal]
      );
      await client.query(
        `UPDATE inventory SET quantity = quantity - $1, updated_at = NOW() WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }
    await client.query(`UPDATE orders SET total_amount=$1 WHERE id=$2`, [total, o.rows[0].id]);
    await client.query('COMMIT');
    res.json(o.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/orders/:id/status
router.put('/:id/status', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not configured' });
  const { status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE orders SET status=$1 WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '找不到' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
