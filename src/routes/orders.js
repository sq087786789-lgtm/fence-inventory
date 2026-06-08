const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/orders
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT o.*, u.name as created_by_name
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `);
    res.json(stmt.all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  try {
    const order = db.prepare(`SELECT * FROM orders WHERE id=?`).get(req.params.id);
    if (!order) return res.status(404).json({ error: '找不到訂單' });
    const items = db.prepare(`
      SELECT oi.*, p.name, p.sku, p.unit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(req.params.id);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders
router.post('/', (req, res) => {
  const { customer_name, notes, items } = req.body;
  const insertOrder = db.prepare(`INSERT INTO orders (order_no, customer_name, notes, created_by) VALUES (?,?,?,?)`);
  const insertItem = db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES (?,?,?,?,?)`);
  const updateInventory = db.prepare(`UPDATE inventory SET quantity = quantity - ?, updated_at = datetime('now') WHERE product_id = ?`);
  const updateOrderTotal = db.prepare(`UPDATE orders SET total_amount = ? WHERE id = ?`);
  try {
    const orderNo = `ORD-${Date.now()}`;
    const orderResult = insertOrder.run(orderNo, customer_name, notes, req.user?.id || null);
    const orderId = orderResult.lastInsertRowid;
    let total = 0;
    for (const item of items) {
      const subtotal = item.quantity * item.price;
      total += subtotal;
      insertItem.run(orderId, item.product_id, item.quantity, item.price, subtotal);
      updateInventory.run(item.quantity, item.product_id);
    }
    updateOrderTotal.run(total, orderId);
    res.json({ id: orderId, order_no: orderNo, total_amount: total });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/orders/:id/status
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  try {
    db.prepare(`UPDATE orders SET status=? WHERE id=?`).run(status, req.params.id);
    res.json({ id: parseInt(req.params.id), status });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
