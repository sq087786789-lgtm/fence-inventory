const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db/db');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  try {
    const user = db.prepare(`SELECT * FROM users WHERE username=?`).get(username);
    if (!user || user.password !== passwordHash) return res.status(401).json({ error: '帳號或密碼錯誤' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'fence2024local', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
