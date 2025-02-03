import { WebSocketServer } from 'ws';
import { config } from '../config/config.js';
import { dbService } from './databaseService.js';

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.pingInterval = null;
    this.checkAliveInterval = null;
  }

  start() {
    try {
      console.log('Initializing WebSocket server...');
      this.wss = new WebSocketServer({
        port: config.websocket.port,
        host: '0.0.0.0', // Ensure we're listening on all interfaces
        clientTracking: true,
        // Add ping/pong keepalive
        pingInterval: 30000, // 30 seconds
        pingTimeout: 10000   // 10 seconds
      });

      console.log(`✅ WebSocket server started on ws://0.0.0.0:${config.websocket.port}`);
      
      this.wss.on('connection', (ws, req) => {
        console.log('New client connecting...');
        this.handleConnection(ws, req);
      });

      this.wss.on('error', (error) => {
        console.error('WebSocket server error:', error);
        this.handleServerError(error);
      });

      this.wss.on('listening', () => {
        console.log('WebSocket server is listening for connections');
      });

      // Start ping interval to keep connections alive
      this.startPingInterval();
      
      // Start checking for dead connections
      this.startConnectionCheck();

    } catch (error) {
      console.error('❌ Failed to start WebSocket server:', error);
      throw error;
    }
  }

  startPingInterval() {
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      this.clients.forEach(client => {
        if (client.readyState === 1) { // OPEN
          client.ping();
        }
      });
    }, 30000);
  }

  startConnectionCheck() {
    // Clear any existing interval
    if (this.checkAliveInterval) {
      clearInterval(this.checkAliveInterval);
    }

    // Check for dead connections every minute
    this.checkAliveInterval = setInterval(() => {
      this.clients.forEach(client => {
        if (client.readyState !== 1) { // Not OPEN
          console.log('🔄 Removing dead connection');
          this.clients.delete(client);
        }
      });
    }, 60000);
  }

  handleServerError(error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${config.websocket.port} is already in use. Try a different port.`);
      this.cleanup();
      process.exit(1);
    } else {
      console.error('❌ WebSocket server error:', error);
    }
  }

  handleServerClose() {
    console.log('🔄 WebSocket server closed, cleaning up...');
    this.cleanup();
  }

  cleanup() {
    // Clear intervals
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.checkAliveInterval) {
      clearInterval(this.checkAliveInterval);
      this.checkAliveInterval = null;
    }

    // Close all client connections
    this.clients.forEach(client => {
      try {
        client.terminate();
      } catch (error) {
        console.error('Error terminating client:', error);
      }
    });
    this.clients.clear();

    // Close server if it exists
    if (this.wss) {
      try {
        this.wss.close();
      } catch (error) {
        console.error('Error closing server:', error);
      }
      this.wss = null;
    }
  }

  formatDeviceStatus(status) {
    try {
      // Ensure device_name exists and is a string
      if (!status?.device_name) {
        console.log('⚠️ Invalid status format:', status);
        return null;
      }

      const deviceName = status.device_name;
      // Create the message in the exact format the frontend expects
      const message = {
        device_name: deviceName,
        [deviceName.toLowerCase()]: status.status?.toLowerCase() || 'off',
        time: status.timestamp || new Date().toISOString(),
        source: 'database'
      };

      console.log('Formatted message:', message);
      return message;
    } catch (error) {
      console.error('❌ Error formatting device status:', error);
      return null;
    }
  }

  async handleConnection(ws, req) {
    const remote = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
    console.log(`🔌 New client connected from ${remote}`);
    
    this.clients.add(ws);
    
    try {
      // Get initial status from database
      console.log('Fetching initial device status from database...');
      const deviceStatus = await dbService.getAllDeviceStatus();
      console.log('📊 Retrieved device status:', deviceStatus);

      // Send each status to the new client
      for (const status of deviceStatus) {
        const formattedMessage = this.formatDeviceStatus(status);
        if (formattedMessage) {
          console.log('📤 Sending initial status:', formattedMessage);
          if (ws.readyState === 1) { // Only send if connection is OPEN
            ws.send(JSON.stringify(formattedMessage));
          }
        }
      }
    } catch (error) {
      console.error('❌ Error sending initial status:', error);
    }

    ws.on('message', (message) => {
      console.log(`📩 Received from ${remote}:`, message.toString());
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      console.log(`👋 Client ${remote} disconnected. ${this.clients.size} clients remaining`);
    });

    ws.on('error', (error) => {
      console.error(`❌ Error with client ${remote}:`, error);
      this.clients.delete(ws);
    });
  }

  broadcast(message) {
    try {
      // Parse string messages
      const messageToSend = typeof message === 'string' ? JSON.parse(message) : message;
      
      // Format the message
      const formattedMessage = {
        ...messageToSend,
        [messageToSend.device_name]: messageToSend[messageToSend.device_name]?.toLowerCase() || 'off',
        time: messageToSend.time || new Date().toISOString()
      };
      
      console.log('📤 Broadcasting message:', formattedMessage);
      
      const messageStr = JSON.stringify(formattedMessage);
      this.clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
          client.send(messageStr);
        }
      });
      console.log(`📡 Broadcasted to ${this.clients.size} clients`);
    } catch (error) {
      console.error('❌ Error broadcasting message:', error);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down WebSocket server...');
  if (wsService) {
    wsService.cleanup();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down WebSocket server...');
  if (wsService) {
    wsService.cleanup();
  }
  process.exit(0);
});

export const wsService = new WebSocketService(); 