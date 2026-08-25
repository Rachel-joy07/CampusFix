// seed.js - Creates the initial Admin + Staff logins (and a demo student + complaint)
// Run once with: npm run seed
const bcrypt = require('bcryptjs');
const db = require('./db');

function upsertUser(name, email, password, role) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    console.log(`- ${role} "${email}" already exists, skipping.`);
    return existing.id;
  }
  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
    .run(name, email, hash, role);
  console.log(`- Created ${role}: ${email} / ${password}`);
  return info.lastInsertRowid;
}

console.log('Seeding CampusFix database...\n');

const adminId = upsertUser('Campus Admin', 'admin@campusfix.edu', 'admin123', 'admin');
const staff1Id = upsertUser('Ramesh (Electrician)', 'staff1@campusfix.edu', 'staff123', 'staff');
const staff2Id = upsertUser('Suresh (Plumber)', 'staff2@campusfix.edu', 'staff123', 'staff');
const studentId = upsertUser('Demo Student', 'student@campusfix.edu', 'student123', 'student');

// Add one sample complaint so the dashboards aren't empty on first run
const existingComplaint = db.prepare('SELECT id FROM complaints LIMIT 1').get();
if (!existingComplaint) {
  db.prepare(
    `INSERT INTO complaints (student_id, title, description, category, location, priority, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    studentId,
    'Flickering lights in Room 204',
    'The tube lights in the classroom keep flickering and it is hard to read the board.',
    'Electrical',
    'Academic Block A, Room 204',
    'Medium',
    'Pending'
  );
  console.log('- Added a sample complaint.');
}

console.log('\nDone! You can log in with:');
console.log('  Admin  -> admin@campusfix.edu   / admin123');
console.log('  Staff  -> staff1@campusfix.edu  / staff123');
console.log('  Staff  -> staff2@campusfix.edu  / staff123');
console.log('  Student-> student@campusfix.edu / student123');
console.log('(or register a new student account from the login page)');
