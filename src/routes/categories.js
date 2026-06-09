const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// GET /api/categories
router.get('/', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not configured' });
  try {
    const result = await pool.query(`SELECT * FROM categories ORDER BY name`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/categories
router.post('/', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not configured' });
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO categories (name, description) VALUES ($1,$2) RETURNING *`,
      [name, description]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not configured' });
  try {
    await pool.query(`DELETE FROM categories WHERE id=$1`, [req.params.id]);
    res.json({ message: '已刪除' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
