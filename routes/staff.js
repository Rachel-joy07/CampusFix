// routes/staff.js - Staff-facing endpoints
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notifyUser } = require('../utils/notify');

const router = express.Router();

router.use(requireAuth, requireRole('staff'));

// GET /api/staff/complaints - complaints assigned to the logged-in staff member
router.get('/complaints', (req, res) => {
  const complaints = db
    .prepare(
      `SELECT c.*, s.name AS student_name
       FROM complaints c
       JOIN users s ON s.id = c.student_id
       WHERE c.assigned_to = ?
       ORDER BY
         CASE c.priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 ELSE 2 END,
         c.created_at DESC`
    )
    .all(req.user.id);
  res.json({ complaints });
});

// PATCH /api/staff/complaints/:id/status - move a complaint to "In Progress" etc.
router.patch('/complaints/:id/status', (req, res) => {
  const { status } = req.body;
  const allowed = ['Assigned', 'In Progress', 'Resolved'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
  }

  const complaint = db
    .prepare('SELECT * FROM complaints WHERE id = ? AND assigned_to = ?')
    .get(req.params.id, req.user.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found or not assigned to you.' });

  db.prepare("UPDATE complaints SET status = ?, updated_at = datetime('now') WHERE id = ?").run(
    status,
    req.params.id
  );

  notifyUser(complaint.student_id, `Your complaint "${complaint.title}" is now "${status}".`);
  res.json({ message: 'Status updated.' });
});

// PATCH /api/staff/complaints/:id/resolve - add a resolution note and mark resolved
router.patch('/complaints/:id/resolve', (req, res) => {
  const { resolution_note } = req.body;
  if (!resolution_note || !resolution_note.trim()) {
    return res.status(400).json({ error: 'A resolution note is required to resolve a complaint.' });
  }

  const complaint = db
    .prepare('SELECT * FROM complaints WHERE id = ? AND assigned_to = ?')
    .get(req.params.id, req.user.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found or not assigned to you.' });

  db.prepare(
    "UPDATE complaints SET status = 'Resolved', resolution_note = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(resolution_note.trim(), req.params.id);

  notifyUser(
    complaint.student_id,
    `Your complaint "${complaint.title}" has been resolved. Please leave feedback!`
  );

  res.json({ message: 'Complaint marked as resolved.' });
});

module.exports = router;
