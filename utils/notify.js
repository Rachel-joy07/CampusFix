// utils/notify.js - small helpers to push in-app notifications
const db = require('../db');

function notifyUser(userId, message) {
  db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(userId, message);
}

function notifyAllAdmins(message) {
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  const stmt = db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
  admins.forEach((a) => stmt.run(a.id, message));
}

module.exports = { notifyUser, notifyAllAdmins };
