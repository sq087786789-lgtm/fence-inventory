const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/products
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT p.*, c.name as category_name, i.quantity, i.min_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      ORDER BY p.id DESC
    `);
    res.json(stmt.all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT p.*, c.name as category_name, i.quantity, i.min_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = ?
    `);
    const row = stmt.get(req.params.id);
    if (!row) return res.status(404).json({ error: '找不到' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products
router.post('/', (req, res) => {
  const { sku, name, category_id, unit, price } = req.body;
  const insertProduct = db.prepare(`INSERT INTO products (sku, name, category_id, unit, price) VALUES (?,?,?,?,?)`);
  const insertInventory = db.prepare(`INSERT INTO inventory (product_id, quantity) VALUES (?, 0)`);
  try {
    const result = insertProduct.run(sku, name, category_id || null, unit || '個', price || 0);
    insertInventory.run(result.lastInsertRowid);
    res.json({ id: result.lastInsertRowid, sku, name, category_id, unit, price });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', (req, res) => {
  const { name, category_id, unit, price } = req.body;
  try {
    const stmt = db.prepare(`UPDATE products SET name=?, category_id=?, unit=?, price=? WHERE id=?`);
    stmt.run(name, category_id, unit, price, req.params.id);
    res.json({ id: parseInt(req.params.id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare(`DELETE FROM products WHERE id=?`).run(req.params.id);
    res.json({ message: '已刪除' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
