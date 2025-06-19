const express = require('express');
const path = require('path');

console.log('Starting minimal server...');

const app = express();
const port = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working' });
});

// Gamification dashboard with fallback
app.get('/api/gamification/dashboard/:userId', (req, res) => {
  const userId = parseInt(req.params.userId) || 1;
  
  res.json({
    success: true,
    data: {
      user: { id: userId, name: 'Usuário', level: 1, xp: 0 },
      stats: { totalXP: 0, level: 1, completedLessons: 0, streak: 0 },
      badges: [],
      wallet: { coins: 0, gems: 0 },
      streaks: { current: 0, longest: 0 },
      goals: [],
      notifications: []
    }
  });
});

// Courses endpoint
app.get('/api/courses', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: 'Fundamentos de IA',
        description: 'Aprenda os conceitos básicos de Inteligência Artificial',
        modules: 7,
        duration: '4 horas',
        difficulty: 'Iniciante'
      }
    ]
  });
});

// Error handling
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`
🚀 Minimal server running on port ${port}
📍 Health: http://localhost:${port}/health
📊 API: http://localhost:${port}/api/test
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});