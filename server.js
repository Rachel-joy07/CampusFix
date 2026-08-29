/*
Authors:2462148-Sheryn Anand
                2462106-Kuragayala Rachel
Duration: 20/08/2026-27/08/2026
Description: 
This is the main entry point script that configures and launches the Express backend server.
It sets up middleware for JSON parsing, static file serving, and registers all the API route modules.
It binds the application to a specified network port, allowing it to listen for incoming HTTP requests.
*/
// server.js - CampusFix backend entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const staffRoutes = require('./routes/staff');

//Loads environment variables and parses incoming JSON data.
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve uploaded complaint images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);

// Serve the frontend (plain HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// Centralized error handler (e.g. multer file-type/size errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`CampusFix server running at http://localhost:${PORT}`);
});
