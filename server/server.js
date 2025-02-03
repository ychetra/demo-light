import { wsService } from './services/websocketService.js';
import { dbService } from './services/databaseService.js';
import MQTTService from './services/mqttService.js';

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
  wsService.broadcast(message);
}

async function main() {
  try {
    // Start WebSocket server
    console.log('Starting WebSocket server...');
    wsService.start();
    console.log('WebSocket server started successfully');

    // Start MQTT client
    console.log('Starting MQTT client...');
    const mqttService = new MQTTService(handleMQTTMessage);
    mqttService.connect();
    console.log('MQTT client started successfully');

    // Add error handlers
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (error) => {
      console.error('Unhandled Rejection:', error);
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 