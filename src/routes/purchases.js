const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/purchases
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT pr.*, p.name as product_name, p.sku, u.name as created_by_name
      FROM purchase_records pr
      JOIN products p ON pr.product_id = p.id
      LEFT JOIN users u ON pr.created_by = u.id
      ORDER BY pr.created_at DESC
      LIMIT 100
    `);
    res.json(stmt.all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/purchases
router.post('/', (req, res) => {
  const { product_id, quantity, price, supplier, notes } = req.body;
  try {
    const insert = db.prepare(`INSERT INTO purchase_records (product_id, quantity, price, supplier, notes, created_by) VALUES (?,?,?,?,?,?)`);
    const result = insert.run(product_id, quantity, price || 0, supplier, notes, req.user?.id || null);
    // 直接入庫
    db.prepare(`UPDATE inventory SET quantity = quantity + ?, updated_at = datetime('now') WHERE product_id = ?`).run(quantity, product_id);
    res.json({ id: result.lastInsertRowid, product_id, quantity, price });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
