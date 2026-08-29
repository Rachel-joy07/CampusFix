/*
Authors:2462148-Sheryn Anand
                2462106-Kuragayala Rachel
Duration: 20/08/2026-27/08/2026
Description: 
This file contains authentication and authorization middleware functions.
It verifies JSON Web Tokens (JWT) to ensure users are authenticated before accessing protected routes.
It also includes role-based access control to restrict endpoints to specific user types like admins, staff, or students.
*/
// middleware/auth.js - JWT auth + role-based access control
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'campusfix_super_secret_change_me';

// Verifies the Bearer token and attaches { id, role, name, email } to req.user
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

// Restricts a route to one or more roles, e.g. requireRole('admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do that.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, JWT_SECRET };
