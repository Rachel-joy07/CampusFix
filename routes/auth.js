// routes/auth.js - Registration, login, and "who am I" endpoints
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
// Students self-register here. (Admin/Staff accounts are created via seed.js
// to keep the demo simple and to mirror how a real campus system would
// pre-provision staff logins.)
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
    .run(name.trim(), email.toLowerCase().trim(), hash, 'student');

  const user = { id: info.lastInsertRowid, name, email: email.toLowerCase(), role: 'student' };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!row || !bcrypt.compareSync(password, row.password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  res.json({ token, user });
});

// GET /api/auth/me - returns the logged-in user (used to restore session on page load)
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
