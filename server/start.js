import { wsService } from './services/websocketService.js';
import { dbService } from './services/databaseService.js';
import MQTTService from './services/mqttService.js';

console.log('Starting server...');

// Test database connection
try {
  console.log('Testing database connection...');
  await dbService.createPool();
} catch (error) {
  console.error('Database connection failed:', error);
}

// Start WebSocket server
try {
  console.log('Starting WebSocket server...');
  wsService.start();
} catch (error) {
  console.error('WebSocket server failed to start:', error);
  process.exit(1);
}

// Start MQTT client
try {
  console.log('Starting MQTT client...');
  const mqttService = new MQTTService((message) => {
    console.log('MQTT message received:', message);
    wsService.broadcast(message);
  });
  mqttService.connect();
} catch (error) {
  console.error('MQTT client failed to start:', error);
}

// Add process handlers
process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

console.log('Server startup complete'); 