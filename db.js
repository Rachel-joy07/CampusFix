/*
Authors:2462148-Sheryn Anand
                2462106-Kuragayala Rachel
Duration: 20/08/2026-27/08/2026
Description: 
This file is responsible for establishing and configuring the connection to the SQLite database.
It initializes the database instance and exports it for use throughout the application's backend.
It serves as the central point for executing SQL queries and managing data persistence.
*/
// db.js - Database connection and schema setup
// Uses Node's BUILT-IN node:sqlite module (Node 22+) — a synchronous,
// file-based SQLite driver that ships with Node itself, so there is no
// native module to compile (no node-gyp, no build tools needed).
// The whole database lives in one file: campusfix.db (created automatically).

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'campusfix.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student','admin','staff')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium',
  image_path TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  assigned_to INTEGER,
  resolution_note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL UNIQUE,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (complaint_id) REFERENCES complaints(id)
);
`);

module.exports = db;
