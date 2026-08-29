/*
Authors:2462148-Sheryn Anand
                2462106-Kuragayala Rachel
Duration: 20/08/2026-27/08/2026
Description: 
This utility file provides reusable functions for the application's notification system.
It handles the logic for creating and dispatching alerts to users regarding complaint status changes.
These functions can be imported across different route handlers to consistently trigger notifications.
*/
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
