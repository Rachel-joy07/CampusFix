/*
Authors:2462148-Sheryn Anand
                2462106-Kuragayala Rachel
Duration: 20/08/2026-27/08/2026
Description: 
This file defines the Express API routes for student-facing features and operations.
It handles endpoints for submitting new complaints, including file uploads for images, and retrieving complaint history.
The routes ensure that students can only access and interact with their own submitted data.
*/
// routes/student.js - Student-facing endpoints
const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notifyAllAdmins } = require('../utils/notify');

const router = express.Router();

//Image upload config
destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `complaint_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Only image files (jpg, png, webp) are allowed.'), ok);
  }
});

router.use(requireAuth, requireRole('student'));

// POST /api/student/complaints - submit a new complaint (with optional image)
router.post('/complaints', upload.single('image'), (req, res) => {
  const { title, description, category, location, priority } = req.body;

  if (!title || !description || !category || !location) {
    return res.status(400).json({ error: 'Title, description, category and location are required.' });
  }

  const validPriorities = ['Low', 'Medium', 'High'];
  const finalPriority = validPriorities.includes(priority) ? priority : 'Medium';
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  const info = db
    .prepare(
      `INSERT INTO complaints (student_id, title, description, category, location, priority, image_path)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, title.trim(), description.trim(), category, location, finalPriority, imagePath);

  notifyAllAdmins(`New ${finalPriority} priority complaint: "${title}" was submitted.`);

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ complaint });
});

// GET /api/student/complaints - complaint history for the logged-in student
router.get('/complaints', (req, res) => {
  const complaints = db
    .prepare(
      `SELECT c.*, u.name AS staff_name
       FROM complaints c
       LEFT JOIN users u ON u.id = c.assigned_to
       WHERE c.student_id = ?
       ORDER BY c.created_at DESC`
    )
    .all(req.user.id);
  res.json({ complaints });
});

// GET /api/student/complaints/:id - track a single complaint
router.get('/complaints/:id', (req, res) => {
  const complaint = db
    .prepare(
      `SELECT c.*, u.name AS staff_name
       FROM complaints c
       LEFT JOIN users u ON u.id = c.assigned_to
       WHERE c.id = ? AND c.student_id = ?`
    )
    .get(req.params.id, req.user.id);

  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  const feedback = db.prepare('SELECT * FROM feedback WHERE complaint_id = ?').get(complaint.id);
  res.json({ complaint, feedback: feedback || null });
});

// POST /api/student/complaints/:id/feedback - rate a resolved complaint
router.post('/complaints/:id/feedback', (req, res) => {
  const { rating, comment } = req.body;
  const complaint = db
    .prepare('SELECT * FROM complaints WHERE id = ? AND student_id = ?')
    .get(req.params.id, req.user.id);

  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });
  if (complaint.status !== 'Resolved') {
    return res.status(400).json({ error: 'You can only give feedback after the complaint is resolved.' });
  }
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  db.prepare(
    `INSERT INTO feedback (complaint_id, rating, comment)
     VALUES (?, ?, ?)
     ON CONFLICT(complaint_id) DO UPDATE SET rating = excluded.rating, comment = excluded.comment`
  ).run(complaint.id, rating, comment || null);

  res.json({ message: 'Thanks for your feedback!' });
});

// GET /api/student/notifications
router.get('/notifications', (req, res) => {
  const notifications = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
    .all(req.user.id);
  res.json({ notifications });
});

// PATCH /api/student/notifications/:id/read
router.patch('/notifications/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(
    req.params.id,
    req.user.id
  );
  res.json({ message: 'Marked as read.' });
});

module.exports = router;
