// routes/admin.js - Admin-facing endpoints
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notifyUser } = require('../utils/notify');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

// GET /api/admin/complaints - list all complaints, with optional filters
// Query params: status, priority, category
router.get('/complaints', (req, res) => {
  const { status, priority, category } = req.query;
  let sql = `
    SELECT c.*, s.name AS student_name, st.name AS staff_name
    FROM complaints c
    JOIN users s ON s.id = c.student_id
    LEFT JOIN users st ON st.id = c.assigned_to
    WHERE 1=1
  `;
  const params = [];
  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }
  if (priority) {
    sql += ' AND c.priority = ?';
    params.push(priority);
  }
  if (category) {
    sql += ' AND c.category = ?';
    params.push(category);
  }
  sql += ' ORDER BY c.created_at DESC';

  const complaints = db.prepare(sql).all(...params);
  res.json({ complaints });
});

// GET /api/admin/staff - list staff members (for the assign dropdown)
router.get('/staff', (req, res) => {
  const staff = db.prepare("SELECT id, name, email FROM users WHERE role = 'staff' ORDER BY name").all();
  res.json({ staff });
});

// PATCH /api/admin/complaints/:id/assign - assign a complaint to a staff member
router.patch('/complaints/:id/assign', (req, res) => {
  const { staff_id } = req.body;
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  if (!staff_id) {
    db.prepare(
      "UPDATE complaints SET assigned_to = NULL, status = 'Pending', resolution_note = NULL, updated_at = datetime('now') WHERE id = ?"
    ).run(req.params.id);
    return res.json({ message: 'Complaint unassigned.' });
  }

  const staff = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'staff'").get(staff_id);
  if (!staff) return res.status(400).json({ error: 'Invalid staff member.' });

  db.prepare(
    "UPDATE complaints SET assigned_to = ?, status = 'Assigned', updated_at = datetime('now') WHERE id = ?"
  ).run(staff_id, req.params.id);

  notifyUser(staff.id, `You have been assigned a new complaint: "${complaint.title}".`);
  notifyUser(complaint.student_id, `Your complaint "${complaint.title}" has been assigned to staff.`);

  res.json({ message: 'Complaint assigned.' });
});

// Priority cannot be changed after submission

// GET /api/admin/stats - dashboard statistics
router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS n FROM complaints').get().n;
  const byStatus = db.prepare('SELECT status, COUNT(*) AS n FROM complaints GROUP BY status').all();
  const byPriority = db.prepare('SELECT priority, COUNT(*) AS n FROM complaints GROUP BY priority').all();
  const byCategory = db.prepare('SELECT category, COUNT(*) AS n FROM complaints GROUP BY category').all();
  const avgRating = db.prepare('SELECT ROUND(AVG(rating), 2) AS avg FROM feedback').get().avg;

  res.json({
    total,
    byStatus,
    byPriority,
    byCategory,
    avgRating: avgRating || 0
  });
});

module.exports = router;
