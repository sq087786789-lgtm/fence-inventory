const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/inventory
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT p.id, p.sku, p.name, p.unit, p.price,
             c.name as category_name,
             i.quantity, i.min_quantity, i.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      ORDER BY p.name
    `);
    res.json(stmt.all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT p.id, p.sku, p.name, p.unit, i.quantity, i.min_quantity
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      WHERE i.quantity <= i.min_quantity
      ORDER BY i.quantity ASC
    `);
    res.json(stmt.all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/inventory/:productId
router.put('/:productId', (req, res) => {
  const { quantity, min_quantity } = req.body;
  try {
    const stmt = db.prepare(`UPDATE inventory SET quantity=?, min_quantity=?, updated_at=datetime('now') WHERE product_id=?`);
    stmt.run(quantity, min_quantity || 0, req.params.productId);
    res.json({ product_id: parseInt(req.params.productId), quantity, min_quantity });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
