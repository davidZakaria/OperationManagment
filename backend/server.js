const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const unitsRoutes = require('./routes/units');
const uploadRoutes = require('./routes/upload');
const reservationsRoutes = require('./routes/reservations');
const uploadReservationsRoutes = require('./routes/upload-reservations');
const formTemplatesRoutes = require('./routes/form-templates');
const formGenerationRoutes = require('./routes/form-generation');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Routes
app.use('/api/units', unitsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/upload-reservations', uploadReservationsRoutes);
app.use('/api/form-templates', formTemplatesRoutes);
app.use('/api/form-generation', formGenerationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Operations Data Manager API is running' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Operations Data Manager API ready`);
}); 