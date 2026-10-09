/**
 * AQUASENSE - Main Application Server
 * AI-Powered Water-Borne Disease Outbreak Early Warning System
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const logger = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');
const alertRoutes = require('./routes/alertRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const mapRoutes = require('./routes/mapRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow frontend from localhost:3000, 5173, etc.
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'AQUASENSE API',
    description: 'AI-Powered Water-Borne Disease Outbreak Early Warning System',
    version: '1.0.0',
    documentation: 'See README.md for endpoint specifications',
    healthCheck: '/api/health'
  });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/map', mapRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize Server & DB
const startServer = async (customPort) => {
  try {
    await connectDB();

    const activePort = customPort || process.env.PORT || 5000;

    const os = require('os');
    const getLocalIp = () => {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            return iface.address;
          }
        }
      }
      return 'localhost';
    };
    const networkIp = getLocalIp();

    const server = app.listen(activePort, '0.0.0.0', () => {
      logger.success(`========================================================`);
      logger.success(`🚀 AQUASENSE Backend Server Running on port ${activePort} (0.0.0.0)`);
      logger.success(`📡 Local:   http://localhost:${activePort}`);
      logger.success(`🌐 Network: http://${networkIp}:${activePort}`);
      logger.success(`🩺 Health:  http://${networkIp}:${activePort}/api/health`);
      logger.success(`========================================================`);
    });

    return server;
  } catch (error) {
    logger.error(`Server initialization failure: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
