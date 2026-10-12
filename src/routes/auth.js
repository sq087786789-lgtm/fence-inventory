const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/db');
const auth = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not configured' });
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string' || username.length > 50 || password.length > 128) return res.status(400).json({ error: '請輸入有效的帳號與密碼' });
  try {
    const result = await pool.query(`SELECT * FROM users WHERE username=$1`, [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: '帳號或密碼錯誤' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: '帳號或密碼錯誤' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理員權限' });
  if (!pool) return res.status(503).json({ error: 'Database not configured' });
  const { username, password, name, role } = req.body;
  if (typeof username !== 'string' || !username.trim() || username.length > 50 || typeof password !== 'string' || password.length < 12 || password.length > 128 || (role && !['admin','staff'].includes(role))) return res.status(400).json({ error: '帳號必填，密碼須為 12–128 字元，角色限 admin 或 staff' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password, name, role) VALUES ($1,$2,$3,$4) RETURNING id, username, name, role`,
      [username, hash, name, role || 'staff']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
