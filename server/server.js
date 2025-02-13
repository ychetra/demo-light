import express from 'express';
import cors from 'cors';
import { wsService } from './services/websocketService.js';
import { dbService } from './services/databaseService.js';
import MQTTService from './services/mqttService.js';
import { config } from './config/config.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

let isDbInitialized = false;

async function initializeDatabase() {
  try {
    if (!isDbInitialized) {
      console.log('Initializing database connection...');
      await dbService.createPool();
      isDbInitialized = true;
      console.log('Database initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

app.use(async (req, res, next) => {
  try {
    if (!isDbInitialized) {
      await initializeDatabase();
    } 
    next();
  } catch (error) {
    console.error('Middleware error:', error);
    res.status(500).json({
      error: 'Server initialization error',
      message: error.message
    });
  }
});

async function handleMQTTMessage(message) {
  console.log('Received MQTT message:', message);
  if (!message.device_name) {
    console.log('⚠️ No device_name in message');
    return;
  }

  const deviceKey = message.device_name.toLowerCase();
  const status = message[deviceKey];

  // Update database
  await dbService.updateDeviceStatus(message.device_name, status);
  
  // Broadcast to WebSocket clients
  wsService.broadcast({
    timestamp: new Date().toISOString(),
    device_name: message.device_name,
    status: status
  });
}

// API Routes - Define these BEFORE static file serving
app.get('/api/reports/daily', async (req, res) => {
  try {
    console.log('Received request for daily reports');
    res.setHeader('Content-Type', 'application/json');
    
    // Initialize database if needed
    if (!isDbInitialized) {
      console.log('Database not initialized, initializing...');
      await initializeDatabase();
    }
    
    // Get database connection
    console.log('Getting database connection...');
    const reports = await dbService.getDailyUsageReports();
    console.log('Reports fetched:', reports);

    if (!reports || !Array.isArray(reports)) {
      console.warn('No reports or invalid format returned');
      return res.json([]);
    }

    return res.json(reports);
  } catch (error) {
    console.error('Error in /api/reports/daily:', error);
    console.error('Stack trace:', error.stack);
    
    // Send a more detailed error response
    return res.status(500).json({ 
      error: 'Failed to fetch reports',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Static file serving - Put this AFTER API routes
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all route for SPA - MUST be last
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

async function main() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start WebSocket server
    await wsService.start();
    console.log(`WebSocket server started on port ${config.websocket.port}`);

    // Start MQTT client
    const mqttService = new MQTTService(handleMQTTMessage);
    mqttService.connect();
    console.log('MQTT client started');

    // Start HTTP server
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });

    // Add error handlers
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (error) => {
      console.error('Unhandled Rejection:', error);
    });

  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 